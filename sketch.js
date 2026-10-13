// p5.js 繁體中文五題簡易指令四選一響應式測驗系統

const questions = [ // 建立五題 p5.js 簡易指令測驗題目資料。
  { text: "哪一個函式會在 p5.js 中建立畫布？", options: ["createCanvas()", "makeCanvas()", "newCanvas()", "buildCanvas()"], answerIndex: 0 }, // 設定第一題的題目、四個選項與正確答案索引。
  { text: "哪一個函式會在每一幀持續執行繪圖程式？", options: ["start()", "draw()", "looping()", "frame()"], answerIndex: 1 }, // 設定第二題的題目、四個選項與正確答案索引。
  { text: "哪一個函式可以設定背景顏色？", options: ["color()", "fillBackground()", "background()", "backColor()"], answerIndex: 2 }, // 設定第三題的題目、四個選項與正確答案索引。
  { text: "哪一個函式可以畫出圓形或橢圓形？", options: ["circle()", "ellipse()", "round()", "ovalShape()"], answerIndex: 1 }, // 設定第四題的題目、四個選項與正確答案索引。
  { text: "哪一個函式可以讓 p5.js 畫布跟隨視窗大小改變？", options: ["windowResize()", "resizeWindow()", "windowResized()", "screenChanged()"], answerIndex: 2 } // 設定第五題的題目、四個選項與正確答案索引。
]; // 結束五題測驗題目資料。

let canvas; // 宣告用來保存全螢幕畫布的變數。
let optionButtons = []; // 宣告用來保存四個選項按鈕的陣列。
let nextButton; // 宣告用來保存下一題按鈕的變數。
let restartButton; // 宣告用來保存重新開始按鈕的變數。
let currentQuestionIndex = 0; // 設定目前題目的索引從第一題開始。
let currentQuestion; // 宣告用來保存目前題目資料的變數。
let score = 0; // 設定目前答對題數為零。
let answered = false; // 設定目前題目尚未作答。
let completed = false; // 設定測驗尚未完成。
let selectedIndex = -1; // 設定目前尚未選擇任何選項。
let bounceStartTime = 0; // 記錄正確選項開始跳動的時間。

function setup() { // 建立 p5.js 初始畫面與介面元件。
  canvas = createCanvas(windowWidth, windowHeight); // 建立尺寸跟隨視窗的全螢幕畫布。
  canvas.position(0, 0); // 將畫布放置在視窗左上角。
  canvas.style("display", "block"); // 移除畫布下方可能產生的行內空白。
  canvas.style("position", "fixed"); // 讓畫布固定在視窗中以避免頁面位移。
  canvas.style("z-index", "0"); // 將畫布放在 DOM 按鈕下方。
  select("body").style("margin", "0"); // 移除頁面預設邊界。
  select("body").style("overflow", "hidden"); // 避免全螢幕畫面出現捲軸。
  select("body").style("font-family", "Noto Sans TC, sans-serif"); // 設定頁面使用適合繁體中文的字型。
  createInterface(); // 只建立一次所有會使用的 DOM 按鈕。
  loadQuestion(); // 載入第一題並顯示四個選項。
} // 結束初始設定函式。

function draw() { // 每一幀更新畫面與介面位置。
  background("#f7fbff"); // 使用柔和淺色作為全螢幕背景。
  if (completed) { // 判斷測驗是否已經完成。
    drawResult(); // 測驗完成時繪製成績畫面。
  } else { // 判斷測驗仍在進行中。
    drawQuiz(); // 測驗進行中時繪製題號、題目與提示文字。
  } // 結束測驗狀態判斷。
  updateLayout(); // 持續更新按鈕位置以支援視窗變更與跳動動畫。
} // 結束每幀繪圖函式。

function createInterface() { // 建立所有 p5.js DOM API 按鈕並設定事件。
  for (let index = 0; index < 4; index += 1) { // 依序建立四個選項按鈕。
    const optionIndex = index; // 保存目前迴圈索引，避免事件回呼取得錯誤索引。
    const button = createButton(""); // 建立一個初始沒有文字的選項按鈕。
    button.mousePressed(() => selectAnswer(optionIndex)); // 設定點擊選項時執行作答函式。
    button.style("font-family", "Noto Sans TC, sans-serif"); // 設定選項按鈕使用清楚的中文字型。
    button.style("font-weight", "600"); // 設定選項文字使用適中的粗細。
    button.style("border", "2px solid #90a4ae"); // 設定選項按鈕的邊框樣式。
    button.style("border-radius", "14px"); // 設定選項按鈕的圓角外觀。
    button.style("padding", "8px 18px"); // 設定選項文字與按鈕邊緣的內距。
    button.style("box-sizing", "border-box"); // 讓按鈕尺寸包含邊框與內距以避免超出配置寬度。
    button.style("text-align", "left"); // 設定選項文字靠左對齊。
    button.style("white-space", "normal"); // 允許較長的選項文字自動換行。
    button.style("overflow-wrap", "anywhere"); // 允許沒有空格的長字串在按鈕內換行。
    button.style("line-height", "1.3"); // 設定多行選項文字的行距。
    button.style("cursor", "pointer"); // 設定滑鼠移入選項按鈕時顯示可點擊游標。
    button.style("touch-action", "manipulation"); // 讓觸控裝置容易點選並減少延遲。
    button.style("-webkit-tap-highlight-color", "transparent"); // 移除行動裝置點選時的突兀色塊。
    button.style("z-index", "2"); // 將選項按鈕放在畫布上方。
    optionButtons.push(button); // 將新建立的選項按鈕放入按鈕陣列。
  } // 結束四個選項按鈕的建立迴圈。
  nextButton = createButton("下一題"); // 建立作答後才能使用的下一題按鈕。
  nextButton.mousePressed(nextQuestion); // 設定點擊下一題按鈕時載入下一題。
  styleActionButton(nextButton, "#0077b6"); // 套用下一題按鈕的共用樣式。
  nextButton.hide(); // 初始時隱藏尚未作答就不能使用的下一題按鈕。
  restartButton = createButton("重新開始"); // 建立測驗完成後使用的重新開始按鈕。
  restartButton.mousePressed(restartQuiz); // 設定點擊重新開始按鈕時重設測驗。
  styleActionButton(restartButton, "#0077b6"); // 套用重新開始按鈕的共用樣式。
  restartButton.hide(); // 初始時隱藏尚未完成測驗的重新開始按鈕。
} // 結束介面建立函式。

function styleActionButton(button, colorValue) { // 設定下一題與重新開始按鈕的共同外觀。
  button.style("font-family", "Noto Sans TC, sans-serif"); // 設定操作按鈕使用清楚的中文字型。
  button.style("font-size", "20px"); // 設定操作按鈕的初始文字大小。
  button.style("font-weight", "700"); // 設定操作按鈕的文字粗細。
  button.style("color", "#ffffff"); // 設定操作按鈕的文字顏色為白色。
  button.style("background-color", colorValue); // 設定操作按鈕的背景顏色。
  button.style("border", "0"); // 移除操作按鈕的預設邊框。
  button.style("border-radius", "12px"); // 設定操作按鈕的圓角外觀。
  button.style("padding", "8px 20px"); // 設定操作按鈕的內距。
  button.style("box-sizing", "border-box"); // 讓操作按鈕尺寸包含內距以避免超出畫面。
  button.style("cursor", "pointer"); // 設定操作按鈕顯示可點擊游標。
  button.style("touch-action", "manipulation"); // 讓操作按鈕適合觸控操作。
  button.style("z-index", "2"); // 將操作按鈕放在畫布上方。
} // 結束操作按鈕樣式函式。

function loadQuestion() { // 載入目前索引所指向的題目。
  currentQuestion = questions[currentQuestionIndex]; // 取得目前題目的完整資料。
  answered = false; // 將目前題目設定為尚未作答。
  selectedIndex = -1; // 清除上一題的選項選擇紀錄。
  bounceStartTime = 0; // 清除上一題的正確選項動畫時間。
  optionButtons.forEach((button, index) => { // 逐一更新四個選項按鈕的文字與狀態。
    button.html(`${String.fromCharCode(65 + index)}. ${currentQuestion.options[index]}`); // 顯示英文字母標記與目前題目的選項文字。
    button.show(); // 顯示目前題目的選項按鈕。
  }); // 結束四個選項按鈕的更新。
  nextButton.hide(); // 載入新題目時先隱藏下一題按鈕。
  restartButton.hide(); // 載入新題目時隱藏重新開始按鈕。
  updateButtonState(); // 將選項按鈕恢復為尚未作答的顏色。
  updateLayout(); // 立即依目前視窗尺寸排列介面。
} // 結束題目載入函式。

function selectAnswer(answerIndex) { // 處理使用者點擊某個選項的作答動作。
  if (answered || completed) { // 判斷目前題目是否已作答或測驗已完成。
    return; // 防止使用者重複作答或在結果頁繼續作答。
  } // 結束防止重複作答的判斷。
  answered = true; // 將目前題目標記為已作答。
  selectedIndex = answerIndex; // 記錄使用者點擊的選項索引。
  if (answerIndex === currentQuestion.answerIndex) { // 判斷使用者是否選到正確答案。
    score += 1; // 答案正確時將答對題數增加一題。
  } else { // 判斷使用者選到錯誤答案。
    bounceStartTime = millis(); // 記錄錯誤作答時間以啟動正確選項跳動動畫。
  } // 結束答案正誤判斷。
  updateButtonState(); // 依照作答結果更新選項背景與文字顏色。
  if (currentQuestionIndex === questions.length - 1) { // 判斷目前是否為最後一題。
    completed = true; // 最後一題作答後將測驗標記為完成。
    optionButtons.forEach((button) => button.hide()); // 完成測驗後隱藏所有選項按鈕。
    nextButton.hide(); // 完成測驗後隱藏下一題按鈕。
    restartButton.show(); // 完成測驗後顯示重新開始按鈕。
  } else { // 判斷目前不是最後一題。
    nextButton.show(); // 答對或答錯後顯示下一題按鈕。
  } // 結束是否為最後一題的判斷。
  updateLayout(); // 立即重新排列作答後的介面元件。
} // 結束選項作答函式。

function updateButtonState() { // 依照目前作答狀態設定四個選項的顏色。
  optionButtons.forEach((button, index) => { // 逐一處理每一個選項按鈕。
    let backgroundColor = "#ffffff"; // 先將選項背景設為白色。
    let textColor = "#17324d"; // 先將選項文字設為深藍色。
    if (answered && index === currentQuestion.answerIndex && selectedIndex !== currentQuestion.answerIndex) { // 判斷答錯時的正確選項。
      backgroundColor = "#caf0f8"; // 將答錯時的正確選項背景設定為指定的 #caf0f8。
      textColor = "#023e8a"; // 將答錯時的正確選項文字設定為深藍色。
    } else if (answered && index === selectedIndex && selectedIndex === currentQuestion.answerIndex) { // 判斷使用者選答正確的選項。
      backgroundColor = "#b7e4c7"; // 將答對的選項背景設定為淡綠色。
      textColor = "#1b4332"; // 將答對的選項文字設定為深綠色。
    } else if (answered && index === selectedIndex) { // 判斷使用者選答錯誤的選項。
      backgroundColor = "#ffd6d6"; // 將答錯的選項背景設定為淡紅色。
      textColor = "#9b2226"; // 將答錯的選項文字設定為深紅色。
    } // 結束選項顏色狀態判斷。
    button.style("background-color", backgroundColor); // 套用目前選項的背景顏色。
    button.style("color", textColor); // 套用目前選項的文字顏色。
    button.style("border-color", answered && index === currentQuestion.answerIndex ? "#48cae4" : "#90a4ae"); // 讓答錯時的正確選項具有醒目邊框。
  }); // 結束四個選項按鈕的顏色更新。
} // 結束選項狀態更新函式。

function nextQuestion() { // 載入下一道測驗題目。
  if (!answered || completed) { // 判斷是否尚未作答或測驗已經完成。
    return; // 未作答時禁止直接進入下一題。
  } // 結束下一題按鈕的使用限制判斷。
  currentQuestionIndex += 1; // 將題目索引移動到下一題。
  loadQuestion(); // 載入並顯示下一題內容。
} // 結束下一題函式。

function restartQuiz() { // 將整份測驗恢復到第一題的初始狀態。
  currentQuestionIndex = 0; // 將目前題目索引重設為第一題。
  score = 0; // 將答對題數重設為零。
  completed = false; // 將測驗完成狀態重設為未完成。
  loadQuestion(); // 重新載入第一題。
} // 結束重新開始函式。

function drawQuiz() { // 繪製測驗進行中的標題、題號、題目與提示。
  const layout = getLayout(); // 取得依目前畫面尺寸計算的版面資料。
  textAlign(CENTER, CENTER); // 將畫布文字設定為水平與垂直置中。
  fill("#023e8a"); // 設定主標題文字顏色。
  textSize(layout.titleSize); // 設定主標題文字大小。
  textStyle(BOLD); // 將主標題設定為粗體。
  text("p5.js 簡易指令測驗", width / 2, layout.titleY); // 顯示測驗主標題。
  fill("#457b9d"); // 設定題號文字顏色。
  textSize(layout.progressSize); // 設定題號文字大小。
  textStyle(NORMAL); // 將題號文字恢復為一般字體。
  text(`第 ${currentQuestionIndex + 1} 題／共 ${questions.length} 題`, width / 2, layout.progressY); // 顯示目前題號與總題數。
  fill("#17324d"); // 設定題目文字顏色。
  textSize(layout.questionSize); // 設定題目文字大小。
  textStyle(BOLD); // 將題目文字設定為粗體。
  drawWrappedText(currentQuestion.text, layout.left, layout.questionTop, layout.contentWidth, layout.questionLineHeight, layout.questionSize, LEFT); // 繪製會依寬度自動換行的題目文字。
  fill("#5c677d"); // 設定作答提示文字顏色。
  textSize(layout.hintSize); // 設定作答提示文字大小。
  textStyle(NORMAL); // 將作答提示文字設定為一般字體。
  if (!answered) { // 判斷目前題目是否尚未作答。
    text("請選擇一個答案", width / 2, layout.hintY); // 顯示尚未作答的提示。
  } else if (selectedIndex === currentQuestion.answerIndex) { // 判斷目前題目是否答對。
    fill("#2d6a4f"); // 將答對提示改為深綠色。
    text("答對了！請按下一題繼續", width / 2, layout.hintY); // 顯示答對後的操作提示。
  } else { // 判斷目前題目是否答錯。
    fill("#9b2226"); // 將答錯提示改為深紅色。
    text(`答錯了，正確答案是 ${String.fromCharCode(65 + currentQuestion.answerIndex)}。請按下一題繼續`, width / 2, layout.hintY); // 顯示答錯提示與正確答案標記。
  } // 結束作答提示狀態判斷。
  textStyle(NORMAL); // 將後續畫布文字恢復為一般字體。
} // 結束測驗畫面繪製函式。

function drawResult() { // 繪製五題完成後的成績畫面。
  const layout = getLayout(); // 取得依目前畫面尺寸計算的版面資料。
  textAlign(CENTER, CENTER); // 將結果文字設定為水平與垂直置中。
  fill("#023e8a"); // 設定結果標題文字顏色。
  textSize(layout.resultTitleSize); // 設定結果標題文字大小。
  textStyle(BOLD); // 將結果標題設定為粗體。
  text("測驗完成！", width / 2, layout.resultTitleY); // 顯示測驗完成標題。
  fill("#17324d"); // 設定成績文字顏色。
  textSize(layout.scoreSize); // 設定成績文字大小。
  text(`你答對了 ${score}／${questions.length} 題`, width / 2, layout.scoreY); // 顯示答對題數與總題數。
  fill("#5c677d"); // 設定結果提示文字顏色。
  textSize(layout.hintSize); // 設定結果提示文字大小。
  text("按下重新開始，再挑戰一次！", width / 2, layout.resultHintY); // 顯示重新開始提示。
  textStyle(NORMAL); // 將後續畫布文字恢復為一般字體。
} // 結束結果畫面繪製函式。

function getLayout() { // 計算適合目前全螢幕尺寸的所有版面座標與字體大小。
  const safeWidth = max(1, width); // 取得至少為一像素的安全畫布寬度。
  const safeHeight = max(1, height); // 取得至少為一像素的安全畫布高度。
  const aspectRatio = safeWidth / safeHeight; // 計算目前畫面的寬高比例。
  const isWide = safeWidth >= 680 || aspectRatio >= 1.45; // 判斷是否使用寬螢幕兩欄選項排列。
  const isCompact = safeHeight < 650; // 判斷是否啟用較緊湊的垂直間距。
  const isVeryCompact = safeHeight < 480; // 判斷是否啟用極小畫面的縮小間距。
  const horizontalMargin = constrain(safeWidth * (isWide ? 0.06 : 0.055), 14, 72); // 依寬度計算不會造成手機溢出的左右邊距。
  const contentWidth = max(1, safeWidth - horizontalMargin * 2); // 計算內容區域寬度。
  const topMargin = constrain(safeHeight * (isVeryCompact ? 0.025 : 0.045), 10, 46); // 依高度計算上方邊距。
  const titleSize = constrain(min(safeWidth * 0.065, safeHeight * 0.075), isVeryCompact ? 20 : 22, isWide ? 38 : 34); // 依視窗寬高縮放標題大小。
  const progressSize = constrain(min(safeWidth * 0.042, safeHeight * 0.05), 15, 20); // 依視窗寬高縮放題號大小。
  let questionSize = constrain(min(safeWidth * 0.055, safeHeight * 0.065), isVeryCompact ? 17 : 19, isWide ? 30 : 28); // 依視窗寬高縮放題目大小。
  const titleY = topMargin + titleSize / 2; // 計算主標題垂直中心位置。
  const progressY = titleY + titleSize * 0.95; // 計算題號垂直中心位置。
  const questionTop = progressY + progressSize * 0.95 + (isVeryCompact ? 6 : 12); // 計算題目文字起始位置。
  let questionLines = getWrappedLines(currentQuestion ? currentQuestion.text : "", questionSize, contentWidth); // 依目前字體與寬度計算題目換行結果。
  if (questionLines.length > 4) { // 判斷題目在目前畫面是否換行過多。
    questionSize = max(isVeryCompact ? 16 : 18, questionSize * 4 / questionLines.length); // 適度縮小題目文字避免佔用過多高度。
    questionLines = getWrappedLines(currentQuestion ? currentQuestion.text : "", questionSize, contentWidth); // 使用縮小後字體重新計算題目換行。
  } // 結束題目文字縮放判斷。
  const questionLineHeight = questionSize * (isVeryCompact ? 1.28 : 1.38); // 計算題目多行文字的行距。
  const questionHeight = max(questionLineHeight, questionLines.length * questionLineHeight); // 計算題目文字區塊高度。
  const hintSize = constrain(min(safeWidth * 0.038, safeHeight * 0.045), 14, 18); // 依視窗寬高縮放提示文字大小。
  const hintY = questionTop + questionHeight + (isVeryCompact ? 5 : 10) + hintSize / 2; // 計算提示文字垂直中心位置。
  const optionStartY = hintY + hintSize / 2 + (isVeryCompact ? 6 : 12); // 計算選項按鈕起始位置。
  const optionGap = constrain(min(safeWidth, safeHeight) * (isWide ? 0.018 : 0.022), 8, 16); // 依裝置尺寸計算選項間距。
  const columnWidth = isWide ? (contentWidth - optionGap) / 2 : contentWidth; // 計算寬螢幕單欄選項寬度。
  const optionTextWidth = max(1, columnWidth - 36); // 預留選項左右內距以計算文字換行。
  let optionFontSize = constrain(min(safeWidth * 0.045, safeHeight * 0.038), 16, isWide ? 22 : 21); // 依視窗寬高縮放選項文字大小。
  const optionLineHeight = optionFontSize * 1.3; // 計算選項多行文字的行距。
  const optionLineCounts = currentQuestion ? currentQuestion.options.map((option) => getWrappedLines(`${option}`, optionFontSize, optionTextWidth).length) : [1, 1, 1, 1]; // 計算四個選項各自需要的行數。
  const maxOptionLines = max(...optionLineCounts); // 取得最長選項需要的最大行數。
  const optionPadding = constrain(safeHeight * 0.012, 7, 12); // 依高度計算選項按鈕上下內距。
  const rows = isWide ? 2 : 4; // 依螢幕寬窄決定選項列數。
  const actionHeight = constrain(safeHeight * 0.075, 44, 56); // 計算操作按鈕高度並維持觸控最小高度。
  const actionGap = constrain(safeHeight * 0.025, 10, 18); // 計算選項與操作按鈕的垂直距離。
  const bottomMargin = constrain(safeHeight * 0.035, 12, 28); // 計算內容區域下方安全邊距。
  const reservedGridHeight = max(44 * rows + optionGap * (rows - 1), safeHeight - optionStartY - actionGap - actionHeight - bottomMargin); // 預留選項網格可使用的高度。
  const maxOptionHeight = max(44, (reservedGridHeight - optionGap * (rows - 1)) / rows); // 計算每列選項可使用的最大高度。
  let optionHeight = max(44, maxOptionLines * optionLineHeight + optionPadding * 2); // 依選項文字行數計算自然按鈕高度。
  if (optionHeight > maxOptionHeight) { // 判斷長選項是否需要縮小文字以維持畫面完整。
    optionFontSize = max(15, optionFontSize * maxOptionHeight / optionHeight); // 在有限高度中縮小選項文字。
    optionHeight = max(44, maxOptionLines * optionFontSize * 1.3 + optionPadding * 2); // 使用縮小後字體重新計算按鈕高度。
  } // 結束選項高度調整判斷。
  optionHeight = min(optionHeight, maxOptionHeight); // 將按鈕高度限制在視窗可容納的範圍內。
  const optionGridHeight = rows * optionHeight + (rows - 1) * optionGap; // 計算選項網格總高度。
  const actionY = optionStartY + optionGridHeight + actionGap; // 計算下一題按鈕的垂直位置。
  const actionWidth = min(contentWidth, max(150, min(280, contentWidth * 0.58))); // 依內容寬度計算操作按鈕寬度。
  const resultTitleSize = constrain(min(safeWidth * 0.085, safeHeight * 0.11), 26, 48); // 依視窗尺寸縮放結果標題大小。
  const scoreSize = constrain(min(safeWidth * 0.07, safeHeight * 0.085), 24, 42); // 依視窗尺寸縮放成績文字大小。
  const resultTitleY = safeHeight * 0.30; // 計算結果標題位置。
  const scoreY = safeHeight * 0.47; // 計算成績文字位置。
  const resultHintY = safeHeight * 0.59; // 計算結果提示位置。
  return { safeWidth, safeHeight, isWide, horizontalMargin, contentWidth, left: horizontalMargin, titleY, progressY, questionTop, questionHeight, questionSize, questionLineHeight, hintY, hintSize, optionStartY, optionGap, columnWidth, optionFontSize, optionHeight, rows, actionHeight, actionY, actionWidth, titleSize, progressSize, resultTitleSize, scoreSize, resultTitleY, scoreY, resultHintY }; // 回傳完整的響應式版面計算結果。
} // 結束版面計算函式。

function getWrappedLines(value, fontSize, maxWidth) { // 依照文字寬度將中英文內容切成不超出框線的多行。
  textSize(fontSize); // 使用指定字體大小量測文字寬度。
  const sourceText = `${value}`; // 將傳入內容轉換成可處理的字串。
  const paragraphs = sourceText.split("\n"); // 先依換行符號分割原有段落。
  const lines = []; // 建立用來保存換行結果的陣列。
  paragraphs.forEach((paragraph) => { // 逐一處理每個原有段落。
    let currentLine = ""; // 建立目前正在累積的文字行。
    Array.from(paragraph).forEach((character) => { // 逐字處理中英文與符號。
      const candidate = currentLine + character; // 組合加入新字元後的候選文字行。
      if (currentLine && textWidth(candidate) > maxWidth) { // 判斷候選文字是否超過可用寬度。
        lines.push(currentLine); // 將已經填滿的文字行加入結果。
        currentLine = character; // 以目前字元開始下一行。
      } else { // 判斷候選文字仍可放入目前文字行。
        currentLine = candidate; // 將目前字元加入正在累積的文字行。
      } // 結束文字寬度判斷。
    }); // 結束逐字換行處理。
    lines.push(currentLine || " "); // 將段落最後一行加入結果並保留空段落高度。
  }); // 結束所有段落的換行處理。
  return lines.length > 0 ? lines : [" "]; // 回傳至少含有一行的換行結果。
} // 結束文字換行函式。

function drawWrappedText(value, x, y, maxWidth, lineHeight, fontSize, alignment) { // 在指定區域繪製自動換行文字。
  const lines = getWrappedLines(value, fontSize, maxWidth); // 依指定畫布文字大小取得換行結果。
  textAlign(alignment, TOP); // 將文字設定為指定水平對齊並從上方開始繪製。
  lines.forEach((line, index) => { // 逐行繪製換行後的文字。
    text(line, x, y + index * lineHeight); // 將每一行繪製在正確的垂直位置。
  }); // 結束逐行文字繪製。
  textAlign(CENTER, CENTER); // 將後續畫布文字恢復為水平與垂直置中。
} // 結束自動換行文字繪製函式。

function updateLayout() { // 依目前視窗尺寸更新所有 DOM 按鈕的排列與大小。
  if (!currentQuestion || optionButtons.length === 0) { // 判斷題目與 DOM 元件是否已經完成初始化。
    return; // 初始化尚未完成時不進行版面計算。
  } // 結束初始化檢查。
  const layout = getLayout(); // 取得目前視窗的響應式版面資料。
  const bounceDistance = min(12, layout.safeHeight * 0.018); // 依畫面高度計算正確選項的跳動幅度。
  optionButtons.forEach((button, index) => { // 逐一更新四個選項按鈕的幾何位置。
    const row = layout.isWide ? floor(index / 2) : index; // 依排列模式計算選項所在列。
    const column = layout.isWide ? index % 2 : 0; // 依排列模式計算選項所在欄。
    let bounceOffset = 0; // 預設選項不產生垂直位移。
    if (!completed && answered && selectedIndex !== currentQuestion.answerIndex && index === currentQuestion.answerIndex) { // 判斷是否需要讓答錯時的正確選項跳動。
      const elapsed = millis() - bounceStartTime; // 計算正確選項動畫已經經過的時間。
      bounceOffset = sin(elapsed * 0.012) * bounceDistance; // 使用正弦函式讓正確選項上下規律跳動。
    } // 結束正確選項跳動判斷。
    const buttonX = layout.left + column * (layout.columnWidth + layout.optionGap); // 計算選項按鈕的水平位置。
    const buttonY = layout.optionStartY + row * (layout.optionHeight + layout.optionGap) + bounceOffset; // 計算選項按鈕的垂直位置。
    button.position(buttonX, buttonY); // 設定選項按鈕目前的位置。
    button.size(layout.columnWidth, layout.optionHeight); // 設定選項按鈕目前的尺寸。
    button.style("font-size", `${layout.optionFontSize}px`); // 套用適合全螢幕尺寸的選項字體大小。
    button.style("min-height", "44px"); // 確保觸控裝置具有容易點選的最小高度。
    button.style("display", completed ? "none" : "block"); // 依測驗狀態控制選項按鈕顯示或隱藏。
  }); // 結束四個選項按鈕的版面更新。
  if (!completed && answered) { // 判斷是否應該顯示下一題按鈕。
    nextButton.position(layout.safeWidth / 2 - layout.actionWidth / 2, layout.actionY); // 將下一題按鈕置於內容區域中央。
    nextButton.size(layout.actionWidth, layout.actionHeight); // 設定下一題按鈕尺寸。
    nextButton.style("font-size", `${constrain(min(layout.safeWidth * 0.045, layout.safeHeight * 0.045), 16, 22)}px`); // 依視窗大小調整下一題文字大小。
    nextButton.style("display", "block"); // 確保下一題按鈕顯示在畫布上方。
  } else { // 判斷目前不應顯示下一題按鈕。
    nextButton.style("display", "none"); // 隱藏目前不需要的下一題按鈕。
  } // 結束下一題按鈕版面判斷。
  if (completed) { // 判斷測驗是否已完成。
    restartButton.position(layout.safeWidth / 2 - layout.actionWidth / 2, layout.safeHeight * 0.68); // 將重新開始按鈕置於結果文字下方中央。
    restartButton.size(layout.actionWidth, layout.actionHeight); // 設定重新開始按鈕尺寸。
    restartButton.style("font-size", `${constrain(min(layout.safeWidth * 0.045, layout.safeHeight * 0.045), 16, 22)}px`); // 依視窗大小調整重新開始文字大小。
    restartButton.style("display", "block"); // 確保重新開始按鈕顯示在畫布上方。
  } else { // 判斷測驗尚未完成。
    restartButton.style("display", "none"); // 隱藏尚未需要使用的重新開始按鈕。
  } // 結束重新開始按鈕版面判斷。
} // 結束版面更新函式。

function windowResized() { // 在瀏覽器視窗尺寸改變時重新調整全螢幕畫布與版面。
  resizeCanvas(windowWidth, windowHeight); // 將畫布尺寸更新為最新的視窗寬度與高度。
  updateLayout(); // 立即依新尺寸重新排列所有介面元件。
} // 結束視窗尺寸變更函式。