const storageKey = "daily-workout-log.entries.v1";
const profileKey = "daily-workout-log.profile.v1";

const defaultWorkoutText = `시티드로우 10      10/10/10/10
레그프레스 10      10/10/10/10
힙어브덕션 22.5  10/10/10/10
천국의계단 레벨  7 20분
어시스트   55     10/10/10/10
랫풀다운   20     10/10/10/10`;

const exerciseRules = [
  { match: ["천국의계단", "스텝밀", "계단"], name: "천국의계단", category: "cardio", met: 8.8, caution: "계단 운동은 무릎과 종아리에 부담이 커질 수 있어요. 손잡이에 기대지 말고 통증이 있으면 레벨을 낮춰요." },
  { match: ["러닝", "런닝", "트레드밀"], name: "러닝", category: "cardio", met: 7.5, caution: "러닝은 발목과 무릎 충격을 확인해요. 숨이 과하게 차면 속도를 낮춰요." },
  { match: ["싸이클", "사이클", "자전거"], name: "사이클", category: "cardio", met: 6.8, caution: "사이클은 안장 높이가 낮으면 무릎 앞쪽이 불편할 수 있어요." },
  { match: ["시티드로우", "로우"], name: "시티드로우", category: "strength", met: 3.8, caution: "로우는 허리를 젖히며 당기지 말고, 어깨가 귀 쪽으로 올라가지 않게 해요." },
  { match: ["레그프레스"], name: "레그프레스", category: "strength", met: 4.5, caution: "레그프레스는 무릎을 완전히 잠그지 말고, 허리가 패드에서 뜨지 않게 해요." },
  { match: ["힙어브덕션", "힙 어브덕션", "어브덕션"], name: "힙어브덕션", category: "strength", met: 3.5, caution: "힙어브덕션은 반동보다 천천히 버티는 느낌이 좋아요." },
  { match: ["어시스트", "어시스트풀업", "어시스트 풀업"], name: "어시스트", category: "strength", met: 4.0, caution: "어시스트 운동은 내려올 때 툭 떨어지지 말고 어깨 전면 통증을 확인해요." },
  { match: ["랫풀다운", "랫 풀다운"], name: "랫풀다운", category: "strength", met: 4.0, caution: "랫풀다운은 목 뒤로 당기기보다 쇄골 쪽으로 당기는 편이 안정적이에요." },
  { match: ["스쿼트"], name: "스쿼트", category: "strength", met: 5.0, caution: "스쿼트는 무릎이 안쪽으로 모이지 않게 하고, 허리 통증이 있으면 깊이를 줄여요." },
  { match: ["벤치프레스", "벤치"], name: "벤치프레스", category: "strength", met: 4.5, caution: "벤치프레스는 손목을 꺾지 말고 어깨 앞쪽이 찝히면 중량을 낮춰요." }
];

const weightInput = document.querySelector("#weightInput");
const heightInput = document.querySelector("#heightInput");
const profileStatus = document.querySelector("#profileStatus");
const dateInput = document.querySelector("#dateInput");
const workoutText = document.querySelector("#workoutText");
const memoInput = document.querySelector("#memoInput");
const workoutForm = document.querySelector("#workoutForm");
const monthWorkoutCount = document.querySelector("#monthWorkoutCount");
const todayCalories = document.querySelector("#todayCalories");
const cardioCalories = document.querySelector("#cardioCalories");
const strengthCalories = document.querySelector("#strengthCalories");
const exerciseCount = document.querySelector("#exerciseCount");
const analysisList = document.querySelector("#analysisList");
const cautionList = document.querySelector("#cautionList");
const historyCount = document.querySelector("#historyCount");
const historyList = document.querySelector("#historyList");
const emptyState = document.querySelector("#emptyState");
const sampleButton = document.querySelector("#sampleButton");
const exportButton = document.querySelector("#exportButton");
const importInput = document.querySelector("#importInput");

let entries = loadJson(storageKey, []);
let profile = loadJson(profileKey, { weight: 60, height: 165 });

weightInput.value = profile.weight;
heightInput.value = profile.height;
dateInput.value = toDateInputValue(new Date());
render();

weightInput.addEventListener("input", saveProfile);
heightInput.addEventListener("input", saveProfile);
workoutText.addEventListener("input", render);
dateInput.addEventListener("input", render);

workoutForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const exercises = parseWorkout(workoutText.value);
  if (!exercises.length) return;

  const date = dateInput.value || toDateInputValue(new Date());
  entries.push({
    id: crypto.randomUUID(),
    date,
    text: workoutText.value,
    memo: memoInput.value.trim(),
    profile: currentProfile(),
    createdAt: new Date().toISOString()
  });

  saveJson(storageKey, entries);
  memoInput.value = "";
  render();
});

sampleButton.addEventListener("click", () => {
  workoutText.value = defaultWorkoutText;
  dateInput.value = toDateInputValue(new Date());
  memoInput.value = "랫풀다운 때 어깨 올라가지 않게 조심";
  render();
});

exportButton.addEventListener("click", () => {
  const payload = { profile: currentProfile(), entries };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `workout-log-${toDateInputValue(new Date())}.json`;
  link.click();
  URL.revokeObjectURL(url);
});

importInput.addEventListener("change", async () => {
  const file = importInput.files?.[0];
  if (!file) return;

  try {
    const data = JSON.parse(await file.text());
    if (data.profile) {
      profile = {
        weight: Number(data.profile.weight) || 60,
        height: Number(data.profile.height) || 165
      };
      weightInput.value = profile.weight;
      heightInput.value = profile.height;
      saveJson(profileKey, profile);
    }
    if (Array.isArray(data.entries)) {
      entries = data.entries.filter((entry) => entry.date && entry.text);
      saveJson(storageKey, entries);
    }
    render();
  } catch {
    alert("백업 파일을 읽지 못했어요.");
  } finally {
    importInput.value = "";
  }
});

function render() {
  const profileNow = currentProfile();
  const previewExercises = parseWorkout(workoutText.value).map((exercise) => ({
    ...exercise,
    calories: estimateCalories(exercise, profileNow.weight)
  }));
  const selectedDate = parseDate(dateInput.value || toDateInputValue(new Date()));
  const monthEntries = entries.filter((entry) => isSameMonth(parseDate(entry.date), selectedDate));
  const cardio = sum(previewExercises.filter((exercise) => exercise.category === "cardio").map((exercise) => exercise.calories));
  const strength = sum(previewExercises.filter((exercise) => exercise.category === "strength").map((exercise) => exercise.calories));

  monthWorkoutCount.textContent = `${uniqueDates(monthEntries).size}회`;
  todayCalories.textContent = `${Math.round(cardio + strength)} kcal`;
  cardioCalories.textContent = `${Math.round(cardio)} kcal`;
  strengthCalories.textContent = `${Math.round(strength)} kcal`;
  exerciseCount.textContent = `${previewExercises.length}개`;

  renderAnalysis(previewExercises);
  renderCautions(previewExercises, profileNow);
  renderHistory();
}

function renderAnalysis(exercises) {
  analysisList.innerHTML = "";

  if (!exercises.length) {
    analysisList.innerHTML = `<p class="empty-copy">운동 내용을 적으면 자동으로 분석돼요.</p>`;
    return;
  }

  exercises.forEach((exercise) => {
    const card = document.createElement("article");
    card.className = "exercise-card";
    card.innerHTML = `
      <div class="exercise-top">
        <div>
          <h3></h3>
          <p></p>
        </div>
        <span class="tag"></span>
      </div>
      <strong class="calorie"></strong>
    `;
    card.querySelector("h3").textContent = exercise.name;
    card.querySelector("p").textContent = exercise.description;
    card.querySelector(".tag").textContent = exercise.category === "cardio" ? "유산소" : "무산소";
    card.querySelector(".tag").classList.add(exercise.category);
    card.querySelector(".calorie").textContent = `약 ${Math.round(exercise.calories)} kcal`;
    analysisList.append(card);
  });
}

function renderCautions(exercises, profileNow) {
  const cautions = new Set();

  exercises.forEach((exercise) => cautions.add(exercise.caution));
  if (profileNow.height && profileNow.weight) {
    const bmi = profileNow.weight / Math.pow(profileNow.height / 100, 2);
    if (bmi >= 25) cautions.add("체중 부담이 있는 편이면 계단과 레그프레스에서 무릎 느낌을 더 자주 확인해요.");
    if (bmi < 18.5) cautions.add("체중이 가벼운 편이면 운동량보다 식사와 회복을 같이 챙기는 게 좋아요.");
  }
  if (exercises.filter((exercise) => exercise.category === "strength").length >= 5) {
    cautions.add("무산소 종목이 많은 날은 다음날 같은 부위 고중량을 피하고 수면을 챙겨요.");
  }

  cautionList.innerHTML = "";
  [...cautions].slice(0, 5).forEach((text) => {
    const item = document.createElement("li");
    item.textContent = text;
    cautionList.append(item);
  });
}

function renderHistory() {
  const sorted = [...entries].sort((a, b) => {
    const dateDifference = parseDate(b.date) - parseDate(a.date);
    if (dateDifference !== 0) return dateDifference;
    return parseTimestamp(b.createdAt) - parseTimestamp(a.createdAt);
  });

  historyCount.textContent = `${uniqueDates(entries).size}일`;
  emptyState.hidden = sorted.length > 0;
  historyList.innerHTML = "";

  sorted.forEach((entry) => {
    const exercises = parseWorkout(entry.text).map((exercise) => ({
      ...exercise,
      calories: estimateCalories(exercise, entry.profile?.weight || currentProfile().weight)
    }));
    const total = Math.round(sum(exercises.map((exercise) => exercise.calories)));
    const cardioCount = exercises.filter((exercise) => exercise.category === "cardio").length;
    const strengthCount = exercises.filter((exercise) => exercise.category === "strength").length;
    const card = document.createElement("li");
    card.className = "history-card";
    card.innerHTML = `
      <div class="history-top">
        <div>
          <h3></h3>
          <p></p>
        </div>
        <button class="delete-button" type="button" aria-label="기록 삭제">×</button>
      </div>
      <strong class="calorie"></strong>
      <p class="memo"></p>
    `;
    card.querySelector("h3").textContent = formatDate(entry.date);
    card.querySelector("p").textContent = `유산소 ${cardioCount}개 · 무산소 ${strengthCount}개`;
    card.querySelector(".calorie").textContent = `약 ${total} kcal`;
    card.querySelector(".memo").textContent = entry.memo ? `메모: ${entry.memo}` : "메모 없음";
    card.querySelector(".delete-button").addEventListener("click", () => {
      entries = entries.filter((current) => current.id !== entry.id);
      saveJson(storageKey, entries);
      render();
    });
    historyList.append(card);
  });
}

function parseWorkout(text) {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseLine);
}

function parseLine(line) {
  const rule = findRule(line);
  const numbers = [...line.matchAll(/\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));
  const minutes = readMinutes(line, rule.category);
  const sets = readSets(line);
  const weight = rule.category === "strength" ? numbers[0] || 0 : 0;
  const reps = sets.reduce((total, value) => total + value, 0);
  const volume = weight && reps ? Math.round(weight * reps) : 0;

  return {
    raw: line,
    name: rule.name || line.split(/\s+/)[0],
    category: rule.category,
    met: rule.met,
    minutes,
    weight,
    sets,
    reps,
    volume,
    caution: rule.caution,
    description: describeExercise(rule.category, minutes, weight, sets, volume, line)
  };
}

function findRule(line) {
  const normalized = line.replace(/\s/g, "").toLowerCase();
  return exerciseRules.find((rule) => rule.match.some((word) => normalized.includes(word.replace(/\s/g, "").toLowerCase()))) || {
    name: line.split(/\s+/)[0],
    category: "strength",
    met: 3.5,
    caution: "새 운동은 자세가 흐트러지지 않는 중량부터 기록해요."
  };
}

function readMinutes(line, category) {
  const minuteMatch = line.match(/(\d+(?:\.\d+)?)\s*분/);
  if (minuteMatch) return Number(minuteMatch[1]);
  return category === "cardio" ? 20 : 4;
}

function readSets(line) {
  const setMatch = line.match(/(\d+(?:\/\d+){1,})/);
  if (!setMatch) return [];
  return setMatch[1].split("/").map(Number).filter((value) => Number.isFinite(value));
}

function describeExercise(category, minutes, weight, sets, volume, line) {
  if (category === "cardio") return `${minutes}분 기준으로 계산 · ${line}`;
  const setText = sets.length ? `${sets.length}세트 ${sets.join("/")}회` : "세트 미입력";
  const weightText = weight ? `${weight}kg` : "중량 미입력";
  const volumeText = volume ? ` · 볼륨 ${volume.toLocaleString("ko-KR")}kg` : "";
  return `${weightText} · ${setText}${volumeText}`;
}

function estimateCalories(exercise, weight) {
  return exercise.met * 3.5 * weight * exercise.minutes / 200;
}

function saveProfile() {
  profile = currentProfile();
  saveJson(profileKey, profile);
  profileStatus.textContent = "저장됨";
  render();
}

function currentProfile() {
  return {
    weight: Number(String(weightInput.value).replace(/[^\d.]/g, "")) || 60,
    height: Number(String(heightInput.value).replace(/[^\d.]/g, "")) || 165
  };
}

function loadJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function sum(values) {
  return values.reduce((total, value) => total + Number(value || 0), 0);
}

function uniqueDates(items) {
  return new Set(items.map((item) => item.date));
}

function parseDate(value) {
  return new Date(`${value}T00:00:00`);
}

function isSameMonth(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  return parseDate(value).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short"
  });
}

function parseTimestamp(value) {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}
