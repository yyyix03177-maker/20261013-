// p5.js 五題簡易指令測驗，外部題庫失敗時會自動改用內建備援資料。 // 說明程式用途。

const FONT_FAMILY = `"LXGW WenKai TC", "Stylish", sans-serif`; // 設定所有 DOM 元素的字型串列。
const CHINESE_FONT = `LXGW WenKai TC`; // 設定中文與 Canvas 的主要字型。
const LATIN_FONT = `Stylish`; // 設定英文、數字與 ASCII 符號的主要字型。
const GOOGLE_SHEETS_CSV_URL = "請在這裡貼上Google試算表CSV網址"; // 設定 Google 試算表 CSV 網址或試算表 ID。
const GOOGLE_SHEETS_GID = `0`; // 設定只貼上試算表 ID 時要讀取的工作表 GID。
const QUIZ_SIZE = 5; // 設定每回合抽出的題目數量。
const OPTION_KEYS = [`optionA`, `optionB`, `optionC`, `optionD`]; // 設定 CSV 四個選項欄位名稱。
const ANSWER_KEYS = [`A`, `B`, `C`, `D`]; // 設定合法答案代號。
const REQUIRED_COLUMNS = [`id`, `text`, ...OPTION_KEYS, `answer`]; // 設定 CSV 必須具備的欄位。
const FALLBACK_CSV = [ // 建立與外部 questions.csv 完全相同的內建備援題庫。
  `\uFEFFid,text,optionA,optionB,optionC,optionD,answer`, // 保存第 1 列備援 CSV 文字。
  `1,哪一個函式會在 p5.js 中建立畫布？,createCanvas(),makeCanvas(),newCanvas(),buildCanvas(),A`, // 保存第 2 列備援 CSV 文字。
  `2,哪一個函式會在 p5.js 中持續執行繪圖程式？,start(),draw(),looping(),frame(),B`, // 保存第 3 列備援 CSV 文字。
  `3,哪一個函式通常用來放置 p5.js 的初始設定程式？,setup(),initial(),begin(),prepare(),A`, // 保存第 4 列備援 CSV 文字。
  `4,哪一個函式可以設定畫布的背景顏色？,color(),fillBackground(),background(),backColor(),C`, // 保存第 5 列備援 CSV 文字。
  `5,哪一個函式可以畫出橢圓形或圓形？,circleShape(),ellipse(),oval(),round(),B`, // 保存第 6 列備援 CSV 文字。
  `6,哪一個函式可以畫出矩形？,square(),box(),rectangle(),rect(),D`, // 保存第 7 列備援 CSV 文字。
  `7,哪一個函式可以設定圖形的填滿顏色？,fill(),insideColor(),paint(),shapeFill(),A`, // 保存第 8 列備援 CSV 文字。
  `8,哪一個函式可以設定圖形外框的顏色？,border(),outline(),stroke(),edgeColor(),C`, // 保存第 9 列備援 CSV 文字。
  `9,哪一個函式可以在畫布上畫出直線？,segment(),line(),drawLine(),straight(),B`, // 保存第 10 列備援 CSV 文字。
  `10,使用者按下滑鼠時，p5.js 會自動呼叫哪一個函式？,mouseClick(),clickMouse(),mousePressed(),pressMouse(),C`, // 保存第 11 列備援 CSV 文字。
  `11,哪一個系統變數代表目前滑鼠游標的水平座標？,mouseX,cursorX,mouseWidth,pointerX(),A`, // 保存第 12 列備援 CSV 文字。
  `12,哪一個系統變數代表目前滑鼠游標的垂直座標？,mouseVertical,mouseY,cursorY(),pointerY,B`, // 保存第 13 列備援 CSV 文字。
  `13,瀏覽器視窗大小改變時，p5.js 會自動呼叫哪一個函式？,windowChanged(),resizeWindow(),windowResized(),screenResized(),C`, // 保存第 14 列備援 CSV 文字。
  `14,哪一個函式可以重新調整既有畫布的寬度與高度？,resizeCanvas(),changeCanvas(),canvasSize(),fitCanvas(),A`, // 保存第 15 列備援 CSV 文字。
  `15,哪一個函式可以在畫布上顯示文字？,write(),label(),showText(),text(),D`, // 保存第 16 列備援 CSV 文字。
].join(`\n`); // 將十五列備援資料組合成 CSV 文字。

let canvasElement; // 保存全螢幕 Canvas 元素。
let optionButtons = []; // 保存只建立一次的四個選項按鈕。
let nextButton; // 保存下一題按鈕。
let restartButton; // 保存重新開始按鈕。
let interfaceCreated = false; // 記錄 DOM 介面是否已建立。
let questionBank = []; // 保存驗證後的完整題庫。
let quizQuestions = []; // 保存本回合抽出的五題。
let currentQuestionIndex = 0; // 保存目前題目的索引。
let currentQuestion = null; // 保存目前顯示的題目。
let score = 0; // 保存答對題數。
let answered = false; // 記錄目前題目是否已作答。
let completed = false; // 記錄本回合是否已完成。
let selectedIndex = -1; // 保存使用者選取的選項索引。
let bounceStart = 0; // 保存正確答案跳動動畫的開始時間。
let loadState = `idle`; // 保存題庫載入狀態。
let bankSource = `fallback`; // 保存目前使用 Google 試算表或內建備援題庫。
let bankStatusMessage = `尚未載入題庫`; // 保存畫面顯示的題庫來源狀態。

function setup() { // 先建立畫面與必要 DOM，再啟動題庫載入。
  canvasElement = createCanvas(windowWidth, windowHeight); // 建立符合視窗大小的全螢幕畫布。
  canvasElement.position(0, 0); // 將畫布放在視窗左上角。
  canvasElement.style(`display`, `block`); // 移除 Canvas 底部預設空白。
  canvasElement.style(`position`, `fixed`); // 讓 Canvas 固定填滿視窗。
  canvasElement.style(`z-index`, `0`); // 將 Canvas 放在 DOM 按鈕下方。
  setCanvasFont(); // 設定 Canvas 的一般字重與中文優先字型。
  createInterface(); // 只建立一次全部 DOM 按鈕。
  loadQuestionBank(); // 完成初始化後開始非同步載入題庫。
} // 結束初始設定。

function draw() { // 持續繪製載入、測驗或結果畫面。
  background(`#f7fbff`); // 清除畫布並設定背景顏色。
  if (loadState === `loading`) { // 判斷題庫是否正在載入。
    drawLoading(); // 顯示載入中的提示。
  } else if (completed) { // 判斷本回合是否已完成。
    drawResult(); // 顯示測驗結果。
  } else if (currentQuestion) { // 確認已經有可用題目。
    drawQuiz(); // 顯示目前題目與答題狀態。
  } // 結束畫面狀態判斷。
  updateLayout(); // 每一幀重新排列 DOM 以支援響應式與動畫。
} // 結束每幀繪圖。

function setCanvasFont() { // 設定 Canvas 使用 LXGW WenKai TC 與一般字重。
  textFont(CHINESE_FONT); // 指定 Canvas 的主要中文字型。
  textStyle(NORMAL); // 將 Canvas 字重固定為一般字重。
} // 結束 Canvas 字型設定。

function setDrawingFont(fontName, fontSize) { // 設定原生 Canvas 文字的字型與大小。
  const safeSize = Math.max(1, Number(fontSize) || 16); // 將字型大小限制為有效正數。
  drawingContext.font = `400 ${safeSize}px "${fontName}", sans-serif`; // 強制原生 Canvas 使用 400 字重。
} // 結束原生 Canvas 字型設定。

function createInterface() { // 建立所有測驗 DOM 元素且只執行一次。
  if (interfaceCreated) { // 檢查介面是否已經建立。
    return; // 已建立時直接返回以避免重複建立。
  } // 結束重複建立檢查。
  interfaceCreated = true; // 將介面標記為已建立。
  for (let index = 0; index < 4; index += 1) { // 逐一建立四個選項按鈕。
    const optionIndex = index; // 保存選項索引供事件函式使用。
    const button = createButton(``); // 建立沒有初始文字的選項按鈕。
    button.mousePressed(() => selectAnswer(optionIndex)); // 設定按鈕點擊事件。
    styleOptionButton(button); // 套用選項按鈕共用樣式。
    button.hide(); // 初始化時先隱藏選項按鈕。
    optionButtons.push(button); // 保存按鈕以便後續重複使用。
  } // 結束四個選項按鈕建立。
  nextButton = createButton(`下一題`); // 建立下一題按鈕。
  nextButton.mousePressed(nextQuestion); // 設定下一題按鈕事件。
  styleActionButton(nextButton); // 套用操作按鈕共用樣式。
  nextButton.hide(); // 初始化時先隱藏下一題按鈕。
  restartButton = createButton(`重新開始`); // 建立重新開始按鈕。
  restartButton.mousePressed(restartQuiz); // 設定重新開始按鈕事件。
  styleActionButton(restartButton); // 套用操作按鈕共用樣式。
  restartButton.hide(); // 初始化時先隱藏重新開始按鈕。
} // 結束 DOM 介面建立。

function forceDomFont(element) { // 強制 DOM 元素使用指定字型與一般字重。
  element.style(`font-family`, FONT_FAMILY); // 以 p5.js DOM API 設定字型。
  element.style(`font-weight`, `400`); // 以 p5.js DOM API 設定一般字重。
  if (element.elt && element.elt.style) { // 確認元素有可用的原生樣式物件。
    element.elt.style.setProperty(`font-family`, FONT_FAMILY, `important`); // 以 important 強制指定字型。
    element.elt.style.setProperty(`font-weight`, `400`, `important`); // 以 important 強制指定一般字重。
  } // 結束原生樣式設定。
} // 結束 DOM 字型設定。

function styleOptionButton(button) { // 設定選項按鈕的外觀與觸控行為。
  forceDomFont(button); // 套用中文與英文指定字型。
  button.style(`font-size`, `18px`); // 設定選項按鈕初始文字大小。
  button.style(`color`, `#17324d`); // 設定選項文字顏色。
  button.style(`background-color`, `#ffffff`); // 設定選項初始背景顏色。
  button.style(`border`, `2px solid #90a4ae`); // 設定選項按鈕邊框。
  button.style(`border-radius`, `14px`); // 設定選項按鈕圓角。
  button.style(`box-sizing`, `border-box`); // 讓按鈕尺寸包含邊框與內距。
  button.style(`padding`, `8px 16px`); // 設定選項按鈕內距。
  button.style(`text-align`, `left`); // 讓選項文字靠左對齊。
  button.style(`white-space`, `normal`); // 允許長文字換行。
  button.style(`overflow-wrap`, `anywhere`); // 允許英文指令在窄螢幕換行。
  button.style(`line-height`, `1.3`); // 設定多行文字行距。
  button.style(`cursor`, `pointer`); // 設定滑鼠游標樣式。
  button.style(`touch-action`, `manipulation`); // 提升手機與平板觸控反應。
  button.style(`z-index`, `2`); // 將按鈕放在 Canvas 上方。
} // 結束選項按鈕樣式設定。

function styleActionButton(button) { // 設定操作按鈕的外觀與觸控行為。
  forceDomFont(button); // 套用中文與英文指定字型。
  button.style(`font-size`, `20px`); // 設定操作按鈕文字大小。
  button.style(`color`, `#ffffff`); // 設定操作按鈕文字顏色。
  button.style(`background-color`, `#0077b6`); // 設定操作按鈕背景顏色。
  button.style(`border`, `0`); // 移除操作按鈕邊框。
  button.style(`border-radius`, `12px`); // 設定操作按鈕圓角。
  button.style(`box-sizing`, `border-box`); // 讓按鈕尺寸包含內距。
  button.style(`padding`, `8px 20px`); // 設定操作按鈕內距。
  button.style(`cursor`, `pointer`); // 設定滑鼠游標樣式。
  button.style(`touch-action`, `manipulation`); // 提升觸控裝置操作反應。
  button.style(`z-index`, `2`); // 將操作按鈕放在 Canvas 上方。
} // 結束操作按鈕樣式設定。

function getConfiguredGoogleSheetsUrl() { // 將設定值轉換成可供 fetch 使用的 Google 試算表 CSV 網址。
  const setting = `${GOOGLE_SHEETS_CSV_URL}`.trim(); // 讀取並清理最前方的設定值。
  const placeholder = `請在這裡貼上Google試算表CSV網址`; // 保存預設佔位文字以便自動判定尚未設定。
  if (!setting || setting === placeholder || setting.includes(`請在這裡`)) { // 判斷網址是否空白或仍是預設佔位文字。
    return ``; // 尚未設定時回傳空字串並使用內建備援題庫。
  } // 結束設定值有效性判斷。
  if (/^https?:\/\//i.test(setting)) { // 判斷設定值是否已經是完整的 HTTP 或 HTTPS 網址。
    return setting; // 完整網址直接作為 Google 試算表 CSV 網址使用。
  } // 結束完整網址判斷。
  if (/^[A-Za-z0-9_-]+$/.test(setting)) { // 判斷設定值是否符合 Google 試算表 ID 的常見格式。
    return `https://docs.google.com/spreadsheets/d/${encodeURIComponent(setting)}/export?format=csv&gid=${encodeURIComponent(GOOGLE_SHEETS_GID)}`; // 依試算表 ID 自動組合 CSV 匯出網址。
  } // 結束試算表 ID 判斷。
  return ``; // 無法辨識的設定值回傳空字串並使用內建備援題庫。
} // 結束 Google 試算表網址轉換函式。

function addCacheBusting(url) { // 為 Google 試算表網址加入時間參數以避免讀到瀏覽器舊快取。
  try { // 嘗試使用原生 URL API 安全加入查詢參數。
    const cacheBustedUrl = new URL(url); // 將網址解析成可修改的 URL 物件。
    cacheBustedUrl.searchParams.set(`t`, `${Date.now()}`); // 以目前時間覆寫快取破除參數。
    return cacheBustedUrl.toString(); // 回傳加入快取破除參數後的網址。
  } catch (error) { // 處理瀏覽器無法解析網址的情況。
    const separator = url.includes(`?`) ? `&` : `?`; // 依原網址是否已有查詢參數選擇連接符號。
    return `${url}${separator}t=${Date.now()}`; // 以字串方式加入快取破除參數。
  } // 結束網址快取破除處理。
} // 結束快取破除函式。

function loadQuestionBank() { // 優先從 Google 試算表 CSV 讀取題庫，失敗或不合法時使用內建資料。
  if (loadState === `loading`) { // 判斷是否已有一次載入正在進行。
    return; // 載入中時避免重複發出請求。
  } // 結束重複載入判斷。
  loadState = `loading`; // 將畫面切換為載入狀態。
  currentQuestion = null; // 載入期間清除目前題目。
  completed = false; // 載入期間清除完成狀態。
  const configuredUrl = getConfiguredGoogleSheetsUrl(); // 取得由網址或試算表 ID 轉換後的設定網址。
  if (!configuredUrl) { // 判斷 Google 試算表網址是否未設定或格式無法辨識。
    useFallbackQuestionBank(`未設定或無法辨識 Google 試算表網址`); // 未設定時直接啟用內建十五題備援資料。
    return; // 啟用備援後結束載入流程。
  } // 結束設定網址檢查。
  if (typeof fetch !== `function`) { // 判斷瀏覽器是否提供 fetch API。
    useFallbackQuestionBank(`瀏覽器不支援 fetch`); // 不支援 fetch 時直接啟用內建題庫。
    return; // 啟用備援後結束載入流程。
  } // 結束 fetch 支援判斷。
  const requestUrl = addCacheBusting(configuredUrl); // 為本次請求加入時間參數以取得最新題庫。
  fetch(requestUrl, { cache: `no-store` }) // 以不使用快取的方式讀取 Google 試算表 CSV。
    .then((response) => { // 處理 Google 試算表的 HTTP 回應。
      if (!response.ok) { // 判斷伺服器是否回傳成功狀態。
        throw new Error(`HTTP ${response.status}`); // 非成功狀態交給 catch 啟用備援。
      } // 結束 HTTP 狀態檢查。
      return response.text(); // 讀取 UTF-8 CSV 文字內容。
    }) // 結束外部回應處理。
    .then((csvText) => { // 處理成功取得的 Google 試算表 CSV 文字。
      const parsedQuestions = validateQuestionRows(parseCSV(csvText)); // 解析並驗證外部題庫欄位與內容。
      setQuestionBank(parsedQuestions, `external`); // 驗證成功後使用 Google 試算表最新題庫。
    }) // 結束外部 CSV 處理。
    .catch((error) => { // 捕捉公開權限、CORS、網路與格式錯誤。
      const reason = error && error.message ? error.message : `未知載入錯誤`; // 取得可供畫面顯示的錯誤原因。
      useFallbackQuestionBank(`Google 試算表載入失敗：${reason}`); // 任何失敗都改用內建十五題備援資料。
    }); // 結束不阻塞的題庫載入流程。
} // 結束題庫載入函式。

function useFallbackQuestionBank(reason) { // 驗證並啟用與原 questions.csv 相同的內建十五題。
  const fallbackQuestions = validateQuestionRows(parseCSV(FALLBACK_CSV)); // 解析內建 CSV 並使用同一套驗證規則。
  bankStatusMessage = reason ? `${reason}，目前使用內建 15 題備援題庫` : `目前使用內建 15 題備援題庫`; // 保存清楚的備援來源狀態。
  setQuestionBank(fallbackQuestions, `fallback`); // 將內建題庫設為目前使用的題庫。
} // 結束內建備援題庫啟用函式。

function setQuestionBank(parsedQuestions, source) { // 設定題庫並開始新的一回合測驗。
  questionBank = parsedQuestions; // 保存驗證後的題庫資料。
  bankSource = source; // 保存目前題庫來源標記。
  if (source === `external`) { // 判斷是否成功使用 Google 試算表題庫。
    bankStatusMessage = `目前使用 Google 試算表最新題庫`; // 顯示外部題庫已成功載入的狀態。
  } // 結束外部題庫狀態設定。
  loadState = `ready`; // 將畫面切換為可作答狀態。
  startQuiz(); // 每次載入完成都洗牌並抽出五題。
} // 結束題庫設定函式。

function parseCSV(csvText) { // 解析支援引號、逗號、換行與 BOM 的 CSV 文字。
  const source = `${csvText}`.replace(/^\uFEFF/, ``); // 移除 UTF-8 BOM 以免污染第一個欄位名稱。
  const rows = []; // 建立 CSV 列陣列。
  let row = []; // 保存目前正在解析的列。
  let field = ``; // 保存目前正在解析的欄位。
  let inQuotes = false; // 記錄目前是否位於雙引號欄位內。
  for (let index = 0; index < source.length; index += 1) { // 逐字解析整份 CSV 文字。
    const character = source[index]; // 取得目前字元。
    const nextCharacter = source[index + 1]; // 取得下一個字元以判斷雙引號跳脫。
    if (inQuotes) { // 判斷目前是否正在雙引號欄位內。
      if (character === `"` && nextCharacter === `"`) { // 判斷是否為 CSV 的雙引號跳脫。
        field += `"`; // 將連續雙引號轉為一個實際雙引號。
        index += 1; // 跳過已處理的第二個雙引號。
      } else if (character === `"`) { // 判斷是否為雙引號欄位的結束符號。
        inQuotes = false; // 離開雙引號欄位。
      } else { // 處理雙引號欄位內的一般字元與換行。
        field += character; // 保留欄位內的原始字元。
      } // 結束雙引號欄位解析。
    } else if (character === `"` && field.length === 0) { // 判斷是否從欄位開頭進入雙引號模式。
      inQuotes = true; // 進入雙引號欄位。
    } else if (character === `,`) { // 判斷是否遇到欄位分隔逗號。
      row.push(field); // 保存目前欄位並開始下一欄。
      field = ``; // 清空下一欄的暫存文字。
    } else if (character === `\n`) { // 判斷是否遇到 Unix 換行。
      row.push(field); // 保存目前列最後一欄。
      rows.push(row); // 保存完整資料列。
      row = []; // 開始解析下一列。
      field = ``; // 清空下一列的欄位暫存。
    } else if (character === `\r`) { // 判斷是否遇到 Windows 或舊式換行。
      if (nextCharacter === `\n`) { // 判斷是否為 CRLF 換行。
        index += 1; // 跳過後續 LF 以免重複產生空列。
      } // 結束 CRLF 判斷。
      row.push(field); // 保存目前列最後一欄。
      rows.push(row); // 保存完整資料列。
      row = []; // 開始解析下一列。
      field = ``; // 清空下一列的欄位暫存。
    } else { // 處理一般欄位文字。
      field += character; // 將字元加入目前欄位。
    } // 結束逐字 CSV 解析。
  } // 結束整份 CSV 文字解析。
  if (inQuotes) { // 判斷 CSV 是否以未關閉的雙引號結束。
    throw new Error(`CSV 雙引號未關閉`); // 回報不合法的 CSV 格式。
  } // 結束雙引號完整性檢查。
  if (field.length > 0 || row.length > 0) { // 判斷檔案結尾是否仍有尚未保存的資料。
    row.push(field); // 保存檔案結尾的最後欄位。
    rows.push(row); // 保存檔案結尾的資料列。
  } // 結束檔案結尾處理。
  return rows; // 回傳完整的 CSV 二維陣列。
} // 結束 CSV 解析器。

function validateQuestionRows(rows) { // 驗證欄位、題數、選項內容與答案代號。
  if (!Array.isArray(rows) || rows.length < 2) { // 判斷 CSV 是否至少包含標題列與一筆資料。
    throw new Error(`CSV 沒有足夠資料`); // 回報空白或不完整的 CSV。
  } // 結束基本資料檢查。
  const headers = rows[0].map((value) => `${value}`.replace(/^\uFEFF/, ``).trim()); // 清理標題列並移除可能殘留的 BOM。
  const columnIndexes = {}; // 建立欄位名稱到索引的對照表。
  REQUIRED_COLUMNS.forEach((column) => { // 逐一檢查所有必要欄位。
    columnIndexes[column] = headers.indexOf(column); // 保存必要欄位在 CSV 的位置。
  }); // 結束必要欄位索引建立。
  const missingColumns = REQUIRED_COLUMNS.filter((column) => columnIndexes[column] < 0); // 找出缺少的必要欄位。
  if (missingColumns.length > 0) { // 判斷 CSV 是否缺少必要欄位。
    throw new Error(`CSV 缺少欄位：${missingColumns.join(`、`)}`); // 回報缺少的欄位名稱。
  } // 結束欄位完整性檢查。
  const dataRows = rows.slice(1).filter((dataRow) => dataRow.some((value) => `${value}`.trim() !== ``)); // 忽略檔案末端的空白列。
  if (dataRows.length < QUIZ_SIZE) { // 判斷題目數是否足夠抽出五題。
    throw new Error(`題庫至少需要 ${QUIZ_SIZE} 題`); // 回報題目數不足。
  } // 結束題目數量檢查。
  const parsedQuestions = []; // 建立驗證後的題目物件陣列。
  const usedIds = new Set(); // 建立題目編號集合以避免重複題目。
  dataRows.forEach((dataRow, rowIndex) => { // 逐列驗證題庫內容。
    const id = `${dataRow[columnIndexes.id] === undefined ? `` : dataRow[columnIndexes.id]}`.trim(); // 讀取並清理題目編號。
    const text = `${dataRow[columnIndexes.text] === undefined ? `` : dataRow[columnIndexes.text]}`.trim(); // 讀取並清理題目文字。
    const options = OPTION_KEYS.map((key) => `${dataRow[columnIndexes[key]] === undefined ? `` : dataRow[columnIndexes[key]]}`.trim()); // 依欄位名稱讀取四個選項。
    const answer = `${dataRow[columnIndexes.answer] === undefined ? `` : dataRow[columnIndexes.answer]}`.trim().toUpperCase(); // 讀取並標準化答案代號。
    if (!id || !text || options.some((option) => option.length === 0)) { // 判斷編號、題目或選項是否空白。
      throw new Error(`第 ${rowIndex + 2} 列題目內容不完整`); // 回報不完整的資料列。
    } // 結束內容完整性檢查。
    if (usedIds.has(id)) { // 判斷題目編號是否重複。
      throw new Error(`第 ${rowIndex + 2} 列的 id 重複`); // 回報重複題目編號。
    } // 結束題目編號檢查。
    if (!ANSWER_KEYS.includes(answer)) { // 判斷答案是否為 A、B、C 或 D。
      throw new Error(`第 ${rowIndex + 2} 列的 answer 必須是 A、B、C 或 D`); // 回報無效答案。
    } // 結束答案格式檢查。
    usedIds.add(id); // 記錄已使用的題目編號。
    parsedQuestions.push({ id, text, options, answerIndex: ANSWER_KEYS.indexOf(answer) }); // 保存可供測驗使用的題目物件。
  }); // 結束所有題目的驗證。
  return parsedQuestions; // 回傳驗證完成的題庫。
} // 結束題庫驗證函式。

function fisherYatesShuffle(items) { // 使用 Fisher-Yates 演算法建立不修改原陣列的排列。
  const shuffled = items.slice(); // 複製題庫以保留原始題目順序。
  for (let index = shuffled.length - 1; index > 0; index -= 1) { // 從陣列尾端向前逐項洗牌。
    const randomIndex = Math.floor(Math.random() * (index + 1)); // 產生包含目前索引的隨機索引。
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]]; // 交換兩個題目完成洗牌。
  } // 結束 Fisher-Yates 洗牌。
  return shuffled; // 回傳洗牌後的題目陣列。
} // 結束 Fisher-Yates 函式。

function startQuiz() { // 開始或重新開始一回合五題測驗。
  if (questionBank.length < QUIZ_SIZE) { // 再次確認題庫足夠抽題。
    useFallbackQuestionBank(`題庫題數不足`); // 異常時以可靠的內建題庫取代。
    return; // 備援題庫設定會重新進入本函式。
  } // 結束題庫數量安全檢查。
  quizQuestions = fisherYatesShuffle(questionBank).slice(0, QUIZ_SIZE); // 每回合洗牌後抽出五題且不重複。
  currentQuestionIndex = 0; // 將目前題目設為第一題。
  score = 0; // 將本回合分數歸零。
  answered = false; // 將目前題目設為未作答。
  completed = false; // 將本回合設為未完成。
  selectedIndex = -1; // 清除先前的選項索引。
  loadCurrentQuestion(); // 顯示抽出的第一題。
} // 結束開始測驗函式。

function loadCurrentQuestion() { // 載入目前索引所對應的題目。
  currentQuestion = quizQuestions[currentQuestionIndex] || null; // 從本回合五題中取得目前題目。
  answered = false; // 重設目前題目的作答狀態。
  selectedIndex = -1; // 清除上一題選取的索引。
  bounceStart = 0; // 清除上一題動畫時間。
  if (!currentQuestion) { // 防止索引異常時存取不存在的題目。
    return; // 沒有題目時停止更新。
  } // 結束題目存在性檢查。
  optionButtons.forEach((button, index) => { // 逐一更新四個選項按鈕。
    const label = `${ANSWER_KEYS[index]}. ${currentQuestion.options[index]}`; // 組合答案代號與選項內容。
    button.html(toMixedHtml(label)); // 以中英文分流 HTML 設定按鈕文字。
    forceDomFont(button); // 更新文字後再次指定 DOM 字型。
    setOptionColor(button, index); // 還原目前題目的選項顏色。
    button.show(); // 顯示目前題目的選項按鈕。
  }); // 結束四個選項按鈕更新。
  nextButton.hide(); // 載入新題目時隱藏下一題按鈕。
  restartButton.hide(); // 測驗進行中隱藏重新開始按鈕。
  updateLayout(); // 立即依目前視窗尺寸排列介面。
} // 結束目前題目載入函式。

function selectAnswer(answerIndex) { // 處理使用者選擇答案的動作。
  if (loadState !== `ready` || !currentQuestion || answered || completed) { // 防止載入中、重複作答或結果頁作答。
    return; // 不符合條件時停止處理。
  } // 結束作答限制檢查。
  answered = true; // 將目前題目標記為已作答。
  selectedIndex = answerIndex; // 保存使用者選取的選項索引。
  if (answerIndex === currentQuestion.answerIndex) { // 判斷使用者答案是否正確。
    score += 1; // 答對時增加分數。
  } else { // 處理使用者答錯的狀況。
    bounceStart = millis(); // 記錄正確選項跳動動畫的開始時間。
  } // 結束答案正誤判斷。
  optionButtons.forEach((button, index) => { // 更新四個選項的作答顏色。
    setOptionColor(button, index); // 依答題結果套用顏色。
  }); // 結束選項顏色更新。
  if (currentQuestionIndex === quizQuestions.length - 1) { // 判斷是否剛完成第五題。
    completed = true; // 將本回合標記為已完成。
    optionButtons.forEach((button) => button.hide()); // 完成後隱藏四個選項按鈕。
    nextButton.hide(); // 完成後隱藏下一題按鈕。
    restartButton.show(); // 完成後顯示重新開始按鈕。
  } else { // 處理尚未完成五題的情況。
    nextButton.show(); // 作答後顯示下一題按鈕。
  } // 結束完成狀態處理。
  updateLayout(); // 立即更新答題後的版面。
} // 結束答案選擇函式。

function setOptionColor(button, index) { // 依答題狀態設定選項背景與文字顏色。
  let backgroundColor = `#ffffff`; // 設定未作答選項的白色背景。
  let textColor = `#17324d`; // 設定未作答選項的深色文字。
  if (answered && selectedIndex !== currentQuestion.answerIndex && index === currentQuestion.answerIndex) { // 判斷答錯時的正確選項。
    backgroundColor = `#caf0f8`; // 套用指定的正確選項背景色。
    textColor = `#023e8a`; // 設定正確答案文字顏色。
  } else if (answered && selectedIndex === currentQuestion.answerIndex && index === selectedIndex) { // 判斷使用者答對的選項。
    backgroundColor = `#b7e4c7`; // 將答對選項設為淡綠色。
    textColor = `#1b4332`; // 設定答對文字顏色。
  } else if (answered && index === selectedIndex) { // 判斷使用者選到錯誤選項。
    backgroundColor = `#ffd6d6`; // 將錯誤選項設為淡紅色。
    textColor = `#9b2226`; // 設定錯誤文字顏色。
  } // 結束選項顏色判斷。
  button.style(`background-color`, backgroundColor); // 套用選項背景色。
  button.style(`color`, textColor); // 套用選項文字色。
  button.style(`border-color`, answered && index === currentQuestion.answerIndex ? `#48cae4` : `#90a4ae`); // 以藍色邊框標示正確答案。
} // 結束選項顏色設定。

function nextQuestion() { // 顯示本回合的下一題。
  if (!answered || completed) { // 確認目前已作答且尚未完成。
    return; // 條件不符時停止換題。
  } // 結束換題條件檢查。
  currentQuestionIndex += 1; // 將目前題目索引增加一題。
  loadCurrentQuestion(); // 載入下一題內容。
} // 結束下一題函式。

function restartQuiz() { // 重新洗牌並開始新的五題測驗。
  startQuiz(); // 使用 Fisher-Yates 重新抽出五題。
} // 結束重新開始函式。

function getSourceLabel() { // 取得目前題庫來源的畫面文字。
  return bankStatusMessage; // 回傳目前 Google 試算表或內建備援題庫的清楚狀態。
} // 結束題庫來源文字函式。

function drawLoading() { // 繪製題庫載入中的畫面。
  setCanvasFont(); // 套用指定字型與一般字重。
  fill(`#023e8a`); // 設定載入標題顏色。
  drawMixedText(`p5.js 簡易指令測驗`, width / 2, height * 0.40, getResponsiveTextSize(32), `center`, `middle`); // 繪製測驗標題。
  fill(`#5c677d`); // 設定載入提示顏色。
  drawMixedText(`正在從 Google 試算表載入題庫，請稍候……`, width / 2, height * 0.53, getResponsiveTextSize(19), `center`, `middle`); // 顯示 Google 試算表題庫載入狀態。
} // 結束載入畫面繪製。

function drawQuiz() { // 繪製進行中的測驗畫面。
  setCanvasFont(); // 套用指定字型與一般字重。
  const layout = getLayout(); // 取得目前視窗的響應式版面資料。
  fill(`#023e8a`); // 設定標題文字顏色。
  drawMixedText(`p5.js 簡易指令測驗`, width / 2, layout.titleY, layout.titleSize, `center`, `middle`); // 繪製測驗標題。
  fill(`#457b9d`); // 設定題號文字顏色。
  drawMixedText(`第 ${currentQuestionIndex + 1} 題／共 ${quizQuestions.length} 題`, width / 2, layout.progressY, layout.progressSize, `center`, `middle`); // 繪製目前進度。
  fill(`#6c757d`); // 設定題庫來源文字顏色。
  drawMixedText(getSourceLabel(), width / 2, layout.sourceY, layout.sourceSize, `center`, `middle`); // 顯示目前使用外部或內建題庫。
  fill(`#17324d`); // 設定題目文字顏色。
  drawWrappedText(currentQuestion.text, layout.margin, layout.questionTop, layout.contentWidth, layout.questionSize, layout.questionLineHeight); // 繪製自動換行的題目。
  if (!answered) { // 判斷目前是否尚未作答。
    fill(`#5c677d`); // 設定尚未作答提示顏色。
    drawMixedText(`請選擇一個答案`, width / 2, layout.hintY, layout.hintSize, `center`, `middle`); // 繪製作答提示。
  } else if (selectedIndex === currentQuestion.answerIndex) { // 判斷目前答案是否正確。
    fill(`#2d6a4f`); // 設定答對提示顏色。
    drawMixedText(`答對了！請按下一題繼續`, width / 2, layout.hintY, layout.hintSize, `center`, `middle`); // 顯示答對提示。
  } else { // 處理目前答錯的情況。
    fill(`#9b2226`); // 設定答錯提示顏色。
    drawMixedText(`答錯了，正確答案是 ${ANSWER_KEYS[currentQuestion.answerIndex]}`, width / 2, layout.hintY, layout.hintSize, `center`, `middle`); // 顯示正確答案代號。
  } // 結束答題提示判斷。
} // 結束測驗畫面繪製。

function drawResult() { // 繪製完成五題後的結果畫面。
  setCanvasFont(); // 套用指定字型與一般字重。
  const layout = getLayout(); // 取得目前視窗的響應式版面資料。
  fill(`#023e8a`); // 設定結果標題顏色。
  drawMixedText(`測驗完成！`, width / 2, layout.resultTitleY, layout.resultTitleSize, `center`, `middle`); // 繪製完成標題。
  fill(`#17324d`); // 設定成績文字顏色。
  drawMixedText(`你答對了 ${score}／${quizQuestions.length} 題`, width / 2, layout.scoreY, layout.scoreSize, `center`, `middle`); // 顯示本回合答對題數。
  fill(`#6c757d`); // 設定題庫來源文字顏色。
  drawMixedText(getSourceLabel(), width / 2, layout.resultSourceY, layout.sourceSize, `center`, `middle`); // 顯示結果頁使用的題庫來源。
  fill(`#5c677d`); // 設定結果提示顏色。
  drawMixedText(`按下重新開始，再抽出五題挑戰一次！`, width / 2, layout.resultHintY, layout.hintSize, `center`, `middle`); // 提示重新開始會再次抽題。
} // 結束結果畫面繪製。

function splitFontRuns(value) { // 將文字拆成 Stylish 英數段與 LXGW 中文段。
  const runs = []; // 建立字型分段結果陣列。
  let currentRun = ``; // 保存目前累積中的文字段。
  let currentFont = ``; // 保存目前文字段所使用的字型。
  Array.from(`${value}`).forEach((character) => { // 逐字檢查 Unicode 字元。
    const nextFont = /[\x20-\x7E]/.test(character) ? LATIN_FONT : CHINESE_FONT; // 讓 ASCII 英文、數字與符號使用 Stylish。
    if (currentRun && currentFont !== nextFont) { // 判斷是否需要切換字型段。
      runs.push({ text: currentRun, font: currentFont }); // 保存已完成的字型段。
      currentRun = ``; // 清空目前文字段。
    } // 結束字型切換判斷。
    currentFont = nextFont; // 更新目前文字段的字型。
    currentRun += character; // 將目前字元加入文字段。
  }); // 結束逐字分段。
  if (currentRun) { // 判斷是否仍有最後一段文字。
    runs.push({ text: currentRun, font: currentFont }); // 保存最後文字段。
  } // 結束最後文字段保存。
  return runs; // 回傳中英文字型分流結果。
} // 結束字型分段函式。

function measureMixedText(value, fontSize) { // 以不同字型量測混合文字總寬度。
  const totalWidth = splitFontRuns(value).reduce((sum, run) => { // 逐段累加實際文字寬度。
    setDrawingFont(run.font, fontSize); // 切換到目前文字段的字型。
    return sum + drawingContext.measureText(run.text).width; // 加上目前文字段寬度。
  }, 0); // 從零開始計算文字寬度。
  return totalWidth; // 回傳整段混合文字的寬度。
} // 結束混合文字量測函式。

function drawMixedText(value, x, y, fontSize, alignMode, baselineMode) { // 以原生 Canvas 分流繪製中英文混合文字。
  const runs = splitFontRuns(value); // 取得中英文與英數的字型分段。
  const totalWidth = measureMixedText(value, fontSize); // 量測整段文字以支援置中。
  let cursorX = alignMode === `center` ? x - totalWidth / 2 : x; // 計算文字開始的水平位置。
  drawingContext.save(); // 保存 Canvas 原生繪圖狀態。
  drawingContext.textAlign = `left`; // 逐段繪製時使用左側對齊。
  drawingContext.textBaseline = baselineMode; // 套用指定的垂直基準。
  runs.forEach((run) => { // 逐段繪製正確字型。
    setDrawingFont(run.font, fontSize); // 強制目前文字段使用指定字型。
    drawingContext.fillText(run.text, cursorX, y); // 使用目前 p5 填色狀態繪製文字。
    cursorX += drawingContext.measureText(run.text).width; // 將下一段移到目前文字段尾端。
  }); // 結束所有文字段繪製。
  drawingContext.restore(); // 還原 Canvas 原生繪圖狀態。
} // 結束混合文字繪製函式。

function getResponsiveTextSize(baseSize) { // 計算載入畫面可用的響應式文字大小。
  return Math.max(16, Math.min(baseSize, Math.min(width * 0.08, height * 0.08))); // 依視窗寬高限制文字大小。
} // 結束通用文字大小計算。

function getLayout() { // 計算電腦、平板與手機直橫向的響應式版面。
  const viewWidth = Math.max(1, width); // 取得安全的畫布寬度。
  const viewHeight = Math.max(1, height); // 取得安全的畫布高度。
  const isWide = viewWidth >= 680 || viewWidth / viewHeight >= 1.45; // 判斷是否使用橫向雙欄選項。
  const compact = viewHeight < 560; // 判斷是否使用緊湊垂直間距。
  const margin = Math.min(64, Math.max(14, viewWidth * 0.055)); // 計算左右安全邊距。
  const contentWidth = Math.max(1, viewWidth - margin * 2); // 計算主要內容寬度。
  const titleSize = Math.min(isWide ? 38 : 32, Math.max(22, Math.min(viewWidth * 0.065, viewHeight * 0.075))); // 計算標題大小。
  const progressSize = Math.min(20, Math.max(15, Math.min(viewWidth * 0.042, viewHeight * 0.05))); // 計算題號大小。
  const sourceSize = Math.min(17, Math.max(13, Math.min(viewWidth * 0.036, viewHeight * 0.042))); // 計算題庫來源文字大小。
  const questionSize = Math.min(isWide ? 29 : 26, Math.max(compact ? 16 : 18, Math.min(viewWidth * 0.052, viewHeight * 0.062))); // 計算題目大小。
  const hintSize = Math.min(18, Math.max(14, Math.min(viewWidth * 0.038, viewHeight * 0.044))); // 計算提示大小。
  const titleY = Math.max(24, viewHeight * 0.065); // 計算標題垂直位置。
  const progressY = titleY + titleSize * 0.9; // 計算進度垂直位置。
  const sourceY = progressY + progressSize * 0.95 + (compact ? 3 : 6); // 計算題庫來源垂直位置。
  const questionTop = sourceY + sourceSize * 0.9 + (compact ? 5 : 9); // 計算題目頂端位置。
  const questionLines = getWrappedLines(currentQuestion ? currentQuestion.text : ``, questionSize, contentWidth); // 計算題目換行行數。
  const questionLineHeight = questionSize * 1.35; // 計算題目行距。
  const questionHeight = Math.max(questionLineHeight, questionLines.length * questionLineHeight); // 計算題目區域高度。
  const hintY = questionTop + questionHeight + (compact ? 4 : 8) + hintSize / 2; // 計算提示垂直位置。
  const optionStartY = hintY + hintSize / 2 + (compact ? 5 : 9); // 計算選項起始位置。
  const gap = Math.min(14, Math.max(7, Math.min(viewWidth, viewHeight) * 0.02)); // 計算選項間距。
  const rows = isWide ? 2 : 4; // 計算選項需要的列數。
  const columnWidth = isWide ? (contentWidth - gap) / 2 : contentWidth; // 計算每個選項欄寬。
  const optionTextWidth = Math.max(1, columnWidth - 34); // 計算選項文字可用寬度。
  const optionSize = Math.min(isWide ? 22 : 20, Math.max(14, Math.min(viewWidth * 0.044, viewHeight * 0.037))); // 計算選項字體大小。
  const optionLineHeight = optionSize * 1.3; // 計算選項行距。
  const optionLines = currentQuestion ? currentQuestion.options.map((value) => getWrappedLines(value, optionSize, optionTextWidth).length) : [1, 1, 1, 1]; // 計算四個選項的行數。
  const maxLines = Math.max(...optionLines); // 取得最長選項的行數。
  const desiredOptionHeight = maxLines * optionLineHeight + 16; // 計算選項自然高度。
  const actionHeight = Math.min(54, Math.max(44, viewHeight * 0.075)); // 計算操作按鈕高度。
  const actionGap = compact ? 6 : 10; // 計算選項與操作按鈕的間距。
  const bottomMargin = compact ? 8 : 18; // 計算底部安全邊距。
  const availableOptionHeight = (viewHeight - optionStartY - actionGap - actionHeight - bottomMargin - gap * (rows - 1)) / rows; // 計算每列可用高度。
  const optionHeight = Math.max(40, Math.min(desiredOptionHeight, availableOptionHeight)); // 將選項高度限制在可用空間。
  const optionGridHeight = rows * optionHeight + (rows - 1) * gap; // 計算選項網格總高度。
  const actionY = optionStartY + optionGridHeight + actionGap; // 計算下一題按鈕位置。
  const actionWidth = Math.min(280, Math.max(150, contentWidth * 0.58)); // 計算操作按鈕寬度。
  const resultTitleSize = Math.min(48, Math.max(26, Math.min(viewWidth * 0.085, viewHeight * 0.11))); // 計算結果標題大小。
  const scoreSize = Math.min(42, Math.max(24, Math.min(viewWidth * 0.07, viewHeight * 0.085))); // 計算成績文字大小。
  return { viewWidth, viewHeight, isWide, margin, contentWidth, titleSize, progressSize, sourceSize, questionSize, hintSize, titleY, progressY, sourceY, questionTop, questionLineHeight, hintY, optionStartY, gap, rows, columnWidth, optionSize, optionHeight, actionHeight, actionY, actionWidth, resultTitleSize, scoreSize, resultTitleY: viewHeight * 0.30, scoreY: viewHeight * 0.47, resultSourceY: viewHeight * 0.57, resultHintY: viewHeight * 0.65 }; // 回傳完整響應式版面資料。
} // 結束版面計算函式。

function getWrappedLines(value, fontSize, maxWidth) { // 依混合字型實際寬度將文字切成多行。
  const lines = []; // 建立換行結果陣列。
  const paragraphs = `${value}`.split(`\n`); // 依原有換行符號分割段落。
  paragraphs.forEach((paragraph) => { // 逐段處理題目與提示文字。
    let line = ``; // 建立目前累積中的文字行。
    Array.from(paragraph).forEach((character) => { // 逐字處理中英文與符號。
      const candidate = line + character; // 組合加入字元後的候選文字。
      if (line && measureMixedText(candidate, fontSize) > maxWidth) { // 判斷候選文字是否超出可用寬度。
        lines.push(line); // 保存已完成的文字行。
        line = character; // 以目前字元開始下一行。
      } else { // 處理文字仍可放入目前行的情況。
        line = candidate; // 將字元加入目前文字行。
      } // 結束文字寬度判斷。
    }); // 結束逐字處理。
    lines.push(line || ` `); // 保存段落最後一行並確保至少一行。
  }); // 結束所有段落處理。
  return lines.length > 0 ? lines : [` `]; // 回傳至少一行文字。
} // 結束文字換行函式。

function drawWrappedText(value, x, y, maxWidth, fontSize, lineHeight) { // 在 Canvas 上繪製自動換行文字。
  const lines = getWrappedLines(value, fontSize, maxWidth); // 取得目前文字的換行結果。
  lines.forEach((line, index) => { // 逐行繪製文字內容。
    drawMixedText(line, x, y + index * lineHeight, fontSize, `left`, `top`); // 依指定字型分流繪製每行。
  }); // 結束逐行繪製。
} // 結束自動換行繪製函式。

function escapeHtml(value) { // 將題目文字中的特殊字元轉成安全 HTML。
  return `${value}`.replace(/&/g, `&amp;`).replace(/</g, `&lt;`).replace(/>/g, `&gt;`).replace(/"/g, `&quot;`).replace(/'/g, `&#39;`); // 避免 CSV 文字被誤當成 HTML 標籤。
} // 結束 HTML 字元跳脫函式。

function toMixedHtml(value) { // 將按鈕內容拆成 Stylish 與 LXGW WenKai TC 的 span。
  return splitFontRuns(value).map((run) => { // 逐段建立對應字型的 span。
    const className = run.font === LATIN_FONT ? `font-latin` : `font-chinese`; // 依字型類型選擇 CSS class。
    return `<span class="${className}">${escapeHtml(run.text)}</span>`; // 回傳安全且明確指定字型的 HTML。
  }).join(``); // 合併全部字型片段。
} // 結束 DOM 中英文字型分流函式。

function updateLayout() { // 重新排列所有已建立的 DOM 元素。
  if (!interfaceCreated || !canvasElement) { // 確認 DOM 與 Canvas 已完成建立。
    return; // 尚未初始化時不進行版面更新。
  } // 結束初始化檢查。
  if (loadState !== `ready` || !currentQuestion) { // 判斷是否仍在載入或尚未有題目。
    optionButtons.forEach((button) => button.style(`display`, `none`)); // 非測驗狀態隱藏四個選項。
    nextButton.style(`display`, `none`); // 非測驗狀態隱藏下一題按鈕。
    restartButton.style(`display`, `none`); // 非結果狀態隱藏重新開始按鈕。
    return; // 非測驗狀態不再執行後續版面計算。
  } // 結束非測驗狀態處理。
  const layout = getLayout(); // 取得目前測驗版面資料。
  const bounceDistance = Math.min(12, layout.viewHeight * 0.018); // 計算答錯時正確選項的跳動幅度。
  optionButtons.forEach((button, index) => { // 逐一更新四個選項的位置與大小。
    const row = layout.isWide ? Math.floor(index / 2) : index; // 計算選項所在列。
    const column = layout.isWide ? index % 2 : 0; // 計算選項所在欄。
    let bounceOffset = 0; // 設定預設垂直位移為零。
    if (!completed && answered && selectedIndex !== currentQuestion.answerIndex && index === currentQuestion.answerIndex) { // 判斷是否需要正確答案上下跳動。
      bounceOffset = Math.sin((millis() - bounceStart) * 0.012) * bounceDistance; // 依時間產生上下動畫。
    } // 結束跳動動畫判斷。
    const x = layout.margin + column * (layout.columnWidth + layout.gap); // 計算選項水平位置。
    const y = layout.optionStartY + row * (layout.optionHeight + layout.gap) + bounceOffset; // 計算選項垂直位置。
    button.position(x, y); // 套用選項按鈕位置。
    button.size(layout.columnWidth, layout.optionHeight); // 套用選項按鈕大小。
    forceDomFont(button); // 響應式更新時再次指定選項字型。
    button.style(`font-size`, `${layout.optionSize}px`); // 套用響應式選項文字大小。
    button.style(`font-weight`, `400`); // 確保選項維持一般字重。
    button.style(`display`, completed ? `none` : `block`); // 依完成狀態顯示或隱藏選項。
  }); // 結束四個選項版面更新。
  if (!completed && answered) { // 判斷是否應顯示下一題按鈕。
    nextButton.position(layout.viewWidth / 2 - layout.actionWidth / 2, layout.actionY); // 將下一題按鈕水平置中。
    nextButton.size(layout.actionWidth, layout.actionHeight); // 設定下一題按鈕尺寸。
    forceDomFont(nextButton); // 重新套用下一題按鈕字型。
    nextButton.style(`font-size`, `${Math.min(22, Math.max(16, Math.min(layout.viewWidth * 0.045, layout.viewHeight * 0.045)))}px`); // 套用響應式操作字級。
    nextButton.style(`font-weight`, `400`); // 確保下一題按鈕維持一般字重。
    nextButton.style(`display`, `block`); // 顯示下一題按鈕。
  } else { // 處理不需要顯示下一題的狀態。
    nextButton.style(`display`, `none`); // 隱藏下一題按鈕。
  } // 結束下一題按鈕版面處理。
  if (completed) { // 判斷是否應顯示重新開始按鈕。
    restartButton.position(layout.viewWidth / 2 - layout.actionWidth / 2, layout.viewHeight * 0.72); // 將重新開始按鈕水平置中。
    restartButton.size(layout.actionWidth, layout.actionHeight); // 設定重新開始按鈕尺寸。
    forceDomFont(restartButton); // 重新套用重新開始按鈕字型。
    restartButton.style(`font-size`, `${Math.min(22, Math.max(16, Math.min(layout.viewWidth * 0.045, layout.viewHeight * 0.045)))}px`); // 套用響應式操作字級。
    restartButton.style(`font-weight`, `400`); // 確保重新開始按鈕維持一般字重。
    restartButton.style(`display`, `block`); // 顯示重新開始按鈕。
  } else { // 處理測驗尚未完成的狀態。
    restartButton.style(`display`, `none`); // 隱藏重新開始按鈕。
  } // 結束重新開始按鈕版面處理。
} // 結束 DOM 版面更新函式。

function windowResized() { // 處理瀏覽器視窗大小變更。
  resizeCanvas(windowWidth, windowHeight); // 將 Canvas 調整為最新視窗大小。
  setCanvasFont(); // 視窗變更後重新指定 Canvas 字型。
  updateLayout(); // 重新計算並排列 DOM 元素。
} // 結束視窗變更函式。
