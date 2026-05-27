'use client'
import { useState, useRef, useCallback } from 'react'
import * as XLSX from 'xlsx'
import styles from './styles.module.css'

/* ─── 색상 팔레트 (자동 순환) ─── */
const PALETTE = [
  ['#1a6ef5','#e8f0fe','#1a3a8f'],
  ['#1a8a4a','#e6f4ec','#145a32'],
  ['#7c3aed','#f3e8ff','#4c1d95'],
  ['#d97706','#fef3c7','#78350f'],
  ['#c2410c','#ffedd5','#7c2d12'],
  ['#be185d','#fce7f3','#831843'],
  ['#0891b2','#e0f2fe','#0c4a6e'],
  ['#65a30d','#f7fee7','#365314'],
  ['#6b7280','#f3f4f6','#374151'],
  ['#9333ea','#faf5ff','#581c87'],
]
function getPalette(idx) { return PALETTE[idx % PALETTE.length] }

function fmt(n) {
  const a = Math.abs(n)
  if (a >= 100000000) return (n / 100000000).toFixed(1) + '억'
  if (a >= 10000000) return Math.round(n / 10000000) + '천만'
  if (a >= 10000) return Math.round(n / 10000) + '만'
  return n.toLocaleString()
}
function fmtFull(n) { return Math.round(n).toLocaleString() + '원' }
function pctChg(a, b) { if (!b) return null; return ((a - b) / Math.abs(b) * 100).toFixed(1) }

/* ─── 집계 엔진: groupCol 기준으로 재집계 ─── */
function aggregateByCol(rawRows, groupCol) {
  const data = {}
  rawRows.forEach(r => {
    const ymRaw = String(r['년월'] || r['연월'] || r['회계연월'] || '').replace(/[^0-9]/g, '')
    const ym = ymRaw.length >= 6 ? ymRaw.slice(0, 6) : ymRaw.length === 4 ? ymRaw + '01' : ''
    if (!ym) return
    const group = String(r[groupCol] || '(미지정)').trim() || '(미지정)'
    const debit = parseFloat(String(r['차변금액'] || r['차변'] || 0).replace(/[^0-9.-]/g, '')) || 0
    const credit = parseFloat(String(r['대변금액'] || r['대변'] || 0).replace(/[^0-9.-]/g, '')) || 0
    const acctCode = String(r['계정코드'] || '')
    const acctName = String(r['계정명'] || '')
    if (!data[ym]) data[ym] = {}
    if (!data[ym][group]) data[ym][group] = { sales: 0, purchase: 0, count: 0, items: [] }
    if (acctCode.startsWith('4') || acctName.includes('매출') || acctName.includes('수익')) {
      data[ym][group].sales += credit || debit
    } else {
      data[ym][group].purchase += debit
    }
    data[ym][group].count++
    if (data[ym][group].items.length < 10) data[ym][group].items.push(r)
  })
  return data
}

/* ─── 엑셀 컬럼 헤더 추출 ─── */
function getColumns(rows) {
  if (!rows.length) return []
  return Object.keys(rows[0])
}

/* ─── 컬럼별 고유값 개수 (미리보기용) ─── */
function getUniqCount(rows, col) {
  const s = new Set(rows.map(r => String(r[col] || '').trim()).filter(Boolean))
  return s.size
}

export default function SalesApp() {
  const [rawRows, setRawRows]       = useState(null)   // 원본 rows
  const [columns, setColumns]       = useState([])     // 엑셀 컬럼 목록
  const [groupCol, setGroupCol]     = useState(null)   // 현재 집계 기준 컬럼
  const [parsedData, setParsedData] = useState(null)
  const [months, setMonths]         = useState([])
  const [activeMonth, setActiveMonth] = useState(null)
  const [fileName, setFileName]     = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(false)
  const [drawer, setDrawer]         = useState(null)
  const [dragging, setDragging]     = useState(false)
  const fileInputRef = useRef()

  /* ─── 파일 처리 ─── */
  const handleFile = useCallback((file) => {
    if (!file) return
    setLoading(true); setError(false)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })
        if (!rows.length) throw new Error('empty')
        const cols = getColumns(rows)
        // 기본 집계 컬럼: '계정명' 있으면 우선, 없으면 첫번째
        const defaultCol = cols.includes('계정명') ? '계정명' : cols[0]
        const data = aggregateByCol(rows, defaultCol)
        const ms = Object.keys(data).sort()
        if (!ms.length) throw new Error('no months')
        setRawRows(rows)
        setColumns(cols)
        setGroupCol(defaultCol)
        setParsedData(data)
        setMonths(ms)
        setActiveMonth(ms[ms.length - 1])
        setFileName(file.name)
        setLoading(false)
      } catch {
        setError(true); setLoading(false)
      }
    }
    reader.readAsArrayBuffer(file)
  }, [])

  /* ─── 집계 기준 변경 ─── */
  const changeGroupCol = (col) => {
    if (!rawRows) return
    const data = aggregateByCol(rawRows, col)
    const ms = Object.keys(data).sort()
    setGroupCol(col)
    setParsedData(data)
    setMonths(ms)
    setActiveMonth(ms[ms.length - 1])
    setDrawer(null)
  }

  const onFileChange = (e) => handleFile(e.target.files[0])
  const onDrop = (e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }

  /* ─── 집계 데이터 ─── */
  const mData = parsedData && activeMonth ? parsedData[activeMonth] || {} : {}
  const prevMonth = activeMonth ? months[months.indexOf(activeMonth) - 1] : null
  const prevData  = prevMonth && parsedData ? parsedData[prevMonth] || {} : null
  const sortedTypes = Object.keys(mData).sort((a, b) => mData[b].sales - mData[a].sales)

  let tS=0,tP=0,tPS=0,tPP=0
  Object.values(mData).forEach(v => { tS += v.sales; tP += v.purchase })
  if (prevData) Object.values(prevData).forEach(v => { tPS += v.sales; tPP += v.purchase })
  const tPro=tS-tP, tProP=tPS-tPP

  const drawerData = drawer && mData[drawer] ? mData[drawer] : null
  const drawerPrev = drawer && prevData ? prevData[drawer] : null
  const drawerIdx  = drawer ? sortedTypes.indexOf(drawer) : 0


  return (
    <div className={styles.app}>

      {/* ── Header ── */}
      <header className={styles.hdr}>
        <div>
          <h1 className={styles.hdrTitle}>매출매입 분석</h1>
          <p className={styles.hdrSub}>
            {parsedData
              ? <>{months.length}개월 · {fileName}</>
              : '엑셀 파일을 업로드해 주세요'}
          </p>
        </div>
        {parsedData ? (
          <div className={styles.hdrIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 17H7A5 5 0 0 1 7 7h2"/><path d="M15 7h2a5 5 0 1 1 0 10h-2"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
          </div>
        ) : (
          <div className={styles.hdrIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 17H7A5 5 0 0 1 7 7h2"/><path d="M15 7h2a5 5 0 1 1 0 10h-2"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
          </div>
        )}
      </header>

      {/* ── Upload ── */}
      <div className={styles.uploadWrap}>
        <div
          className={`${styles.uploadZone} ${dragging?styles.uploadDrag:''} ${fileName?styles.uploadDone:''}`}
          onDragOver={(e)=>{e.preventDefault();setDragging(true)}}
          onDragLeave={()=>setDragging(false)}
          onDrop={onDrop}
          onClick={()=>fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={onFileChange} style={{display:'none'}} />
          {loading ? (
            <><div className={styles.spinner}/><p style={{color:'#1a6ef5',fontWeight:500}}>분석 중...</p></>
          ) : error ? (
            <><svg viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:32,height:32,marginBottom:8}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><p style={{color:'#c0392b',fontWeight:500}}>파일을 읽을 수 없습니다</p><span>다시 시도해 주세요</span></>
          ) : fileName ? (
            <><svg viewBox="0 0 24 24" fill="none" stroke="#1a8a4a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:30,height:30,marginBottom:6}}><polyline points="20 6 9 17 4 12"/></svg><p style={{color:'#1a8a4a',fontWeight:500}}>{fileName}</p><span>탭하여 재업로드</span></>
          ) : (
            <><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{width:34,height:34,marginBottom:8,stroke:'#9ea3b0'}}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><p>계정별원장 엑셀 업로드</p><span>xlsx · xls · csv · 드래그 또는 탭</span></>
          )}
        </div>
      </div>

      {parsedData && (<>

        {/* ── 집계기준 버튼 바 ── */}
        {(() => {
          const skipKeywords = ['년월','연월','회계연월','회계일','기표일','기표번호','전표번호','사업자번호','금액','차변','대변','잔액']
          const candidates = columns
            .filter(col => !skipKeywords.some(k => col.includes(k)))
            .map(col => ({ col, uniq: getUniqCount(rawRows, col) }))
            .sort((a, b) => a.uniq - b.uniq)
            .slice(0, 5)
            .map(c => c.col)
          return (
            <div className={styles.groupBar}>
              <span className={styles.groupBarLbl}>집계기준</span>
              <div className={styles.groupBarBtns}>
                {candidates.map(col => (
                  <button
                    key={col}
                    className={`${styles.groupBarBtn} ${groupCol === col ? styles.groupBarBtnOn : ''}`}
                    onClick={() => changeGroupCol(col)}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>
          )
        })()}

        {/* ── Month tabs ── */}
        <div className={styles.monthScroll}>
          {months.map(m => {
            const yr=m.slice(0,4), mo=parseInt(m.slice(4))
            return (
              <button key={m} className={`${styles.mtab} ${m===activeMonth?styles.mtabOn:''}`} onClick={()=>setActiveMonth(m)}>
                {yr}.{String(mo).padStart(2,'0')}
              </button>
            )
          })}
        </div>

        {/* ── Summary ── */}
        <div className={styles.sumGrid}>
          {[
            ['총 매출', fmt(tS), tS>tPS?'pos':tS<tPS?'neg':'', tPS?pctChg(tS,tPS):null],
            ['총 매입', fmt(tP), tP>tPP?'neg':tP<tPP?'pos':'', tPP?pctChg(tP,tPP):null],
            ['손익',    fmt(tPro), tPro>=0?'pos':'neg', tProP?pctChg(tPro,tProP):null],
            ['손익률',  tS?(tPro/tS*100).toFixed(1)+'%':'-', tPro>=0?'pos':'neg', null],
          ].map(([l,v,cls,pc]) => (
            <div className={styles.scard} key={l}>
              <div className={styles.scardLbl}>{l}</div>
              <div className={`${styles.scardVal} ${styles[cls]||''}`}>{v}</div>
              {pc!=null && <div className={`${styles.scardChg} ${parseFloat(pc)>=0?styles.pos:styles.neg}`}>{parseFloat(pc)>=0?'▲':'▼'} {Math.abs(pc)}% 전월비</div>}
            </div>
          ))}
        </div>

        {/* ── Type rows ── */}
        <div className={styles.slbl}>{groupCol} 별 현황</div>
        <div className={styles.rows}>
          {sortedTypes.map((type, idx) => {
            const d = mData[type]
            const profit = d.sales - d.purchase
            const margin = d.sales ? (profit/d.sales*100).toFixed(1) : '0.0'
            const [dot, bg, tx] = getPalette(idx)
            return (
              <div key={type} className={styles.rcard} style={{animationDelay:`${idx*40}ms`}} onClick={()=>setDrawer(type)}>
                <div className={styles.rcTop}>
                  <div className={styles.rcName}>
                    <div className={styles.rcDot} style={{background:dot}}/>
                    <span className={styles.rcLbl}>{type}</span>
                  </div>
                  <span className={styles.rcBadge} style={{background:bg,color:tx}}>{margin}%</span>
                </div>
                <div className={styles.rcNums}>
                  {[[fmt(d.sales),'매출','#1a6ef5'],[fmt(d.purchase),'매입','#111318'],[fmt(profit),'손익',profit>=0?'#1a8a4a':'#c0392b']].map(([v,l,c])=>(
                    <div className={styles.rcNum} key={l}>
                      <div className={styles.rcNumV} style={{color:c}}>{v}</div>
                      <div className={styles.rcNumL}>{l}</div>
                    </div>
                  ))}
                </div>
                <div className={styles.rcFoot}>
                  <span className={styles.rcFootT}>{d.count.toLocaleString()}건</span>
                  <span className={styles.rcMore}>상세 보기 ›</span>
                </div>
              </div>
            )
          })}
        </div>
      </>)}

      {/* ════════════════════════════════
          상세 드로어
      ════════════════════════════════ */}
      <div className={`${styles.overlay} ${drawer?styles.overlayOn:''}`} onClick={()=>setDrawer(null)}/>
      <div className={`${styles.drawer} ${drawer?styles.drawerOpen:''}`}>
        <div className={styles.dHandle}/>
        <div className={styles.dHdr}>
          <div>
            <span className={styles.dTitle}>{drawer}</span>
            <div style={{fontSize:11,color:'#9ea3b0',marginTop:2}}>{groupCol} 기준</div>
          </div>
          <button className={styles.dClose} onClick={()=>setDrawer(null)}>✕</button>
        </div>
        {drawerData && (
          <div className={styles.dBody}>
            <div className={styles.dSec}>핵심 지표</div>
            {[
              ['매출', fmtFull(drawerData.sales), ''],
              ['매입', fmtFull(drawerData.purchase), ''],
              ['손익', fmtFull(drawerData.sales-drawerData.purchase), drawerData.sales-drawerData.purchase>=0?'pos':'neg'],
              ['손익률', drawerData.sales?((drawerData.sales-drawerData.purchase)/drawerData.sales*100).toFixed(1)+'%':'-', ''],
              ['거래건수', drawerData.count.toLocaleString()+'건', ''],
            ].map(([l,v,c]) => (
              <div className={styles.dRow} key={l}>
                <span className={styles.dRowL}>{l}</span>
                <span className={`${styles.dRowV} ${c?styles[c]:''}`}>{v}</span>
              </div>
            ))}

            {drawerPrev && (() => {
              const pp=drawerPrev.sales-drawerPrev.purchase
              const cp=drawerData.sales-drawerData.purchase
              const yr=prevMonth.slice(0,4), mo=parseInt(prevMonth.slice(4))
              const cyr=activeMonth.slice(0,4), cmo=parseInt(activeMonth.slice(4))
              const maxV=Math.max(drawerData.sales,drawerPrev.sales,1)
              return (<>
                <div className={styles.dSec}>전월 대비</div>
                {[['매출 증감',pctChg(drawerData.sales,drawerPrev.sales),true],['매입 증감',pctChg(drawerData.purchase,drawerPrev.purchase),false],['손익 변동',pctChg(cp,pp),true]].map(([l,pc,posGood])=>pc==null?null:(
                  <div className={styles.dRow} key={l}>
                    <span className={styles.dRowL}>{l}</span>
                    <span className={`${styles.dRowV} ${parseFloat(pc)>=0?(posGood?styles.pos:styles.neg):(posGood?styles.neg:styles.pos)}`}>{parseFloat(pc)>=0?'▲':'▼'} {Math.abs(pc)}%</span>
                  </div>
                ))}
                <div className={styles.dSec}>월별 매출 추이</div>
                {[[`${yr}년 ${mo}월`,drawerPrev.sales,'#93c5fd'],[`${cyr}년 ${cmo}월`,drawerData.sales,getPalette(drawerIdx)[0]]].map(([lbl,val,color])=>(
                  <div className={styles.barRow} key={lbl}>
                    <span className={styles.barLbl}>{lbl}</span>
                    <div className={styles.barTrack}><div className={styles.barFill} style={{width:Math.round(val/maxV*100)+'%',background:color}}/></div>
                    <span className={styles.barNum}>{fmt(val)}</span>
                  </div>
                ))}
              </>)
            })()}

            {drawerData.items?.length>0 && (<>
              <div className={styles.dSec}>최근 거래내역</div>
              {drawerData.items.slice(0,8).map((it,i)=>{
                const amt=parseFloat(String(it['차변금액']||it['대변금액']||0).replace(/[^0-9.-]/g,''))||0
                const desc=String(it['적요']||'').slice(0,32)||'-'
                const party=String(it['거래처']||'')
                const date=String(it['회계일']||it['기표일']||'').slice(5,10)
                return (
                  <div className={styles.txItem} key={i}>
                    <div className={styles.txDesc}>{desc}</div>
                    <div className={styles.txSub}>
                      <span className={styles.txParty}>{party}{date?` · ${date}`:''}</span>
                      <span className={styles.txAmt}>{fmt(amt)}</span>
                    </div>
                  </div>
                )
              })}
            </>)}
          </div>
        )}
      </div>
    </div>
  )
}


