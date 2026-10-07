const form = document.querySelector("#calculator");
const formError = document.querySelector("#form-error");
const noExtras = document.querySelector("#no-extras");
const extrasGrid = document.querySelector(".extras-grid");
const extrasFields = document.querySelector("#extras-fields");
const extrasLockedNote = document.querySelector("#extras-locked-note");
const dismissalIndemnityPanel = document.querySelector("#dismissal-indemnity-panel");
const dismissalIndemnityInput = document.querySelector("#dismissal-indemnity");
const aguinaldoInput = document.querySelector("#aguinaldo");
const aguinaldoField = document.querySelector("#aguinaldo-field");
const resignationDetails = document.querySelector("#resignation-details");
const resignationNotice = document.querySelector("#resignation-notice");
const statusLabel = document.querySelector("#result-status");
const calculationNote = document.querySelector("#calculation-note");
const employmentStart = document.querySelector("#employment-start");
const employmentEnd = document.querySelector("#employment-end");
const holidayDaysInput = document.querySelector("#holiday-days");
const holidayListContainer = document.querySelector("#holiday-list-container");
const holidayList = document.querySelector("#holiday-list");
const holidayListEmpty = document.querySelector("#holiday-list-empty");
const holidaySelectionCount = document.querySelector("#holiday-selection-count");
const vacationDetails = document.querySelector("#vacation-details");
const lastVacationStart = document.querySelector("#last-vacation-start");
const noPreviousVacation = document.querySelector("#no-previous-vacation");
const vacationRestDay = document.querySelector("#vacation-rest-day");
const selectedHolidayDates = new Set();
const numberValue = (name) => Number(new FormData(form).get(name) || 0);
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const holidayDateFormatter = new Intl.DateTimeFormat("es-SV", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

function localDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function latestHolidayDateValue() {
  const today = localDateValue();
  const isResignation = form.querySelector('input[name="cause"]:checked').value === "resignation";
  if (isResignation && employmentEnd.value) return employmentEnd.value;
  return employmentEnd.value && employmentEnd.value < today ? employmentEnd.value : today;
}

function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function holidaysForYear(year) {
  const easter = easterSunday(year);
  const holidays = [
    ["Año Nuevo", new Date(year, 0, 1)],
    ["Jueves Santo", new Date(year, easter.getMonth(), easter.getDate() - 3)],
    ["Viernes Santo", new Date(year, easter.getMonth(), easter.getDate() - 2)],
    ["Sábado Santo", new Date(year, easter.getMonth(), easter.getDate() - 1)],
    ["Día del Trabajo", new Date(year, 4, 1)],
    ["Día de la Madre", new Date(year, 4, 10)],
    ["Día del Padre", new Date(year, 5, 17)],
    ["Día del Divino Salvador del Mundo", new Date(year, 7, 6)],
    ["Día de la Independencia", new Date(year, 8, 15)],
    ["Día de los Difuntos", new Date(year, 10, 2)],
    ["Asueto del 21 de noviembre", new Date(year, 10, 21)],
    ["Navidad", new Date(year, 11, 25)]
  ];
  return holidays.map(([name, date]) => ({ name, dateValue: localDateValue(date) }));
}

function renderHolidayList() {
  const startDate = employmentStart.value;
  const endDate = latestHolidayDateValue();
  holidayList.replaceChildren();
  if (!startDate || !endDate || startDate > endDate) {
    holidayListEmpty.textContent = "Indica las fechas de inicio y finalización de labores para mostrar los asuetos del período.";
    holidayListEmpty.hidden = false;
    return;
  }

  const holidays = [];
  for (let year = Number(startDate.slice(0, 4)); year <= Number(endDate.slice(0, 4)); year += 1) {
    holidays.push(...holidaysForYear(year).filter(({ dateValue }) => dateValue >= startDate && dateValue <= endDate));
  }
  holidays.sort((a, b) => a.dateValue.localeCompare(b.dateValue));
  holidayListEmpty.hidden = holidays.length > 0;
  if (holidays.length === 0) {
    holidayListEmpty.textContent = "No hay días de asueto nacionales dentro del período indicado.";
    return;
  }

  for (const { name, dateValue } of holidays) {
    const date = new Date(`${dateValue}T00:00:00`);
    const label = document.createElement("label");
    label.className = "holiday-option";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = "holiday-date";
    checkbox.value = dateValue;
    checkbox.checked = selectedHolidayDates.has(dateValue);
    const text = document.createElement("span");
    text.textContent = `${name} — ${holidayDateFormatter.format(date)}`;
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) selectedHolidayDates.add(dateValue);
      else selectedHolidayDates.delete(dateValue);
      updateHolidaySelection();
      if (statusLabel.textContent === "CÁLCULO ACTUALIZADO" && validateForm()) calculate();
    });
    label.append(checkbox, text);
    holidayList.append(label);
  }
}

function updateHolidaySelection() {
  const startDate = employmentStart.value;
  const endDate = latestHolidayDateValue();
  for (const dateValue of selectedHolidayDates) {
    if (!startDate || !endDate || dateValue < startDate || dateValue > endDate) selectedHolidayDates.delete(dateValue);
  }
  const count = selectedHolidayDates.size;
  holidayDaysInput.value = String(count);
  holidaySelectionCount.textContent = `${count} ${count === 1 ? "día seleccionado" : "días seleccionados"}`;
  renderHolidayList();
}

function updateWorkedHolidayFields() {
  const workedHolidays = form.querySelector('input[name="worked-holidays"]:checked')?.value;
  holidayListContainer.hidden = workedHolidays !== "yes";
  if (workedHolidays !== "yes") {
    selectedHolidayDates.clear();
    holidayDaysInput.value = "0";
    holidaySelectionCount.textContent = "0 días seleccionados";
  }
  renderHolidayList();
}

function updateEmploymentDateLimits() {
  const today = localDateValue();
  const isResignation = form.querySelector('input[name="cause"]:checked').value === "resignation";
  employmentStart.max = today;
  employmentEnd.max = isResignation ? "" : today;
  employmentEnd.min = employmentStart.value || "";
  employmentStart.min = "";
  lastVacationStart.min = employmentStart.value || "";
  lastVacationStart.max = isResignation ? (employmentEnd.value || today) : [employmentEnd.value, today].filter(Boolean).sort()[0] || today;
}

function updateVacationRestDay() {
  lastVacationStart.disabled = noPreviousVacation.checked;
  lastVacationStart.required = !noPreviousVacation.checked;
  if (noPreviousVacation.checked) {
    vacationRestDay.textContent = "No se registra una jornada anterior; para el cálculo proporcional se usará la fecha de ingreso.";
    return;
  }
  if (!lastVacationStart.value) {
    vacationRestDay.textContent = "Selecciona la fecha de inicio para identificar el séptimo día de descanso.";
    return;
  }

  const [year, month, day] = lastVacationStart.value.split("-").map(Number);
  const seventhDay = new Date(year, month - 1, day + 6);
  vacationRestDay.textContent = `Tomando el inicio de la jornada vacacional como día 1, el séptimo día (descanso semanal) corresponde al ${holidayDateFormatter.format(seventhDay)}.`;
}

function scheduleEmploymentDateLimitRefresh() {
  const now = new Date();
  const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  window.setTimeout(() => {
    updateEmploymentDateLimits();
    updateHolidaySelection();
    scheduleEmploymentDateLimitRefresh();
  }, nextDay - now);
}

function updateServicePeriod() {
  if (!employmentStart.value || !employmentEnd.value || employmentStart.value > employmentEnd.value) return;

  const [startYear, startMonth, startDay] = employmentStart.value.split("-").map(Number);
  const [endYear, endMonth, endDay] = employmentEnd.value.split("-").map(Number);
  let years = endYear - startYear;
  let months = endMonth - startMonth;
  let days = endDay - startDay;

  if (days < 0) {
    months -= 1;
    days += new Date(Date.UTC(endYear, endMonth - 1, 0)).getUTCDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  form.elements.years.value = years;
  form.elements.months.value = months;
  form.elements["extra-days"].value = days;
}

function countServiceDays() {
  const years = numberValue("years");
  const months = numberValue("months");
  const extraDays = numberValue("extra-days");
  return years * 360 + months * 30 + extraDays;
}

function dateDifferenceInDays(startDate, endDate) {
  const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
  const [endYear, endMonth, endDay] = endDate.split("-").map(Number);
  const startUtc = Date.UTC(startYear, startMonth - 1, startDay);
  const endUtc = Date.UTC(endYear, endMonth - 1, endDay);
  return (endUtc - startUtc) / 86400000;
}

function calculateAguinaldo(salary, serviceDays) {
  const startDate = employmentStart.value;
  const endDate = employmentEnd.value;
  if (!startDate || !endDate || startDate > endDate) return 0;

  const serviceYears = serviceDays / 360;
  const bonusDays = serviceYears > 10 ? 21 : serviceYears >= 3 ? 19 : 15;
  const dailySalary = salary / 30;
  const endYear = Number(endDate.slice(0, 4));
  const octoberFirst = `${endYear}-10-01`;

  if (endDate >= octoberFirst) return dailySalary * bonusDays;

  const accrualPeriodStart = `${endYear - 1}-10-01`;
  const accrualStart = startDate > accrualPeriodStart ? startDate : accrualPeriodStart;
  const accruedDays = dateDifferenceInDays(accrualStart, endDate) + 1;
  const accrualPeriodDays = dateDifferenceInDays(accrualPeriodStart, octoberFirst);
  return dailySalary * bonusDays * (accruedDays / accrualPeriodDays);
}

function calculateVacationProportional(salary) {
  if (form.querySelector('input[name="vacation-paid"]:checked')?.value !== "no") return 0;

  const startDate = employmentStart.value;
  const endDate = employmentEnd.value;
  const accrualStart = noPreviousVacation.checked ? startDate : lastVacationStart.value;
  if (!accrualStart || !endDate || accrualStart > endDate) return 0;

  const dailySalary = salary / 30;
  const annualVacationPay = dailySalary * 15 * 1.3;
  let periodStart = accrualStart;
  let vacationPay = 0;

  while (periodStart <= endDate) {
    const [year, month, day] = periodStart.split("-").map(Number);
    const nextYear = year + 1;
    const daysInAnniversaryMonth = new Date(nextYear, month, 0).getDate();
    const anniversaryDate = `${nextYear}-${String(month).padStart(2, "0")}-${String(Math.min(day, daysInAnniversaryMonth)).padStart(2, "0")}`;
    const accrualPeriodDays = dateDifferenceInDays(periodStart, anniversaryDate);
    const accruedDays = endDate < anniversaryDate
      ? dateDifferenceInDays(periodStart, endDate) + 1
      : accrualPeriodDays;
    vacationPay += annualVacationPay * (accruedDays / accrualPeriodDays);
    if (endDate < anniversaryDate) break;
    periodStart = anniversaryDate;
  }

  return vacationPay;
}

function updateResignationFields() {
  const cause = form.querySelector('input[name="cause"]:checked').value;
  const isResignation = cause === "resignation";
  const isDismissal = cause === "dismissal";
  dismissalIndemnityPanel.hidden = !isDismissal;
  aguinaldoField.hidden = !isDismissal;
  document.querySelector('[data-result="dismissalIndemnity"]').closest(".result-row").hidden = !isDismissal;
  resignationDetails.hidden = !isResignation;
  resignationDetails.disabled = !isResignation;

  const employeeType = form.querySelector('input[name="employee-type"]:checked')?.value;
  if (!employeeType) {
    resignationNotice.textContent = "Selecciona el tipo de empleado para consultar el aviso previo aplicable.";
  } else {
    const noticeDays = employeeType === "head" ? 30 : 15;
    const employeeDescription = employeeType === "head" ? "el personal de jefatura" : "el personal común";
    resignationNotice.textContent = `Según la normativa salvadoreña sobre renuncia voluntaria, ${employeeDescription} debe avisar al patrono con al menos ${noticeDays} días de anticipación para tener derecho a indemnización.`;
  }

  const compliance = form.querySelector('input[name="resignation-compliance"]:checked')?.value;
  const lockExtras = isResignation && compliance === "no";
  extrasFields.disabled = lockExtras || noExtras.checked;
  noExtras.disabled = lockExtras;
  extrasGrid.classList.toggle("is-disabled", lockExtras || noExtras.checked);
  extrasLockedNote.hidden = !lockExtras;
  document.querySelector("#special-days-section").classList.toggle("is-locked", lockExtras);
}

function calculate() {
  const salary = numberValue("salary");
  const serviceDays = countServiceDays();
  const minimumWage = numberValue("minimum-wage");
  const dailySalary = salary / 30;
  const serviceYears = serviceDays / 360;
  const cause = new FormData(form).get("cause");
  const resignationCompliance = new FormData(form).get("resignation-compliance");
  let indemnity = 0;
  let afpDeduction = 0;
  let isssDeduction = 0;

  const contributionBase = salary * serviceYears;
  afpDeduction = contributionBase * 0.0725;
  isssDeduction = contributionBase * 0.03;

  if (cause === "dismissal") {
    const baseDismissal = contributionBase;
    const dismissalCap = Math.max(salary, minimumWage) * 3;
    indemnity = Math.max(0, Math.min(baseDismissal, dismissalCap) - afpDeduction - isssDeduction);
    const formattedIndemnity = money.format(indemnity);
    dismissalIndemnityInput.value = formattedIndemnity;
  } else {
    dismissalIndemnityInput.value = money.format(0);
  }

  if (cause === "resignation" && resignationCompliance === "yes" && serviceYears >= 2) {
    const remainder = serviceDays % 360;
    const resignationYears = Math.floor(serviceDays / 360) + (remainder >= 180 ? remainder / 360 : 0);
    /*indemnity = Math.min(salary, minimumWage * 2) / 2 * resignationYears;*/
  }

  const extrasUnavailable = noExtras.checked || (cause === "resignation" && resignationCompliance === "no");
  const dayHours = extrasUnavailable ? 0 : numberValue("day-hours");
  const nightHours = extrasUnavailable ? 0 : numberValue("night-hours");
  const holidayDays = extrasUnavailable ? 0 : numberValue("holiday-days");
  const restDays = extrasUnavailable ? 0 : numberValue("rest-days");
  const aguinaldo = calculateAguinaldo(salary, serviceDays);
  const vacationProportional = calculateVacationProportional(salary);
  aguinaldoInput.value = money.format(aguinaldo);
  const hourlySalary = dailySalary / 8;
  const results = {
    dayOvertime: dayHours * hourlySalary * 2,
    nightOvertime: nightHours * hourlySalary * 2 * 1.25,
    holiday: holidayDays * dailySalary * 2,
    rest: restDays * dailySalary * 1.5,
    dismissalIndemnity: cause === "dismissal" ? indemnity : 0,
    afpDeduction: -afpDeduction,
    isssDeduction: -isssDeduction,
    aguinaldo,
    vacationProportional
  };
  for (const key of Object.keys(results)) {
    results[key] = Math.round((results[key] + Number.EPSILON) * 100) / 100;
  }
  results.total = results.dayOvertime + results.nightOvertime + results.holiday + results.rest + results.dismissalIndemnity + results.aguinaldo + results.vacationProportional + (cause === "resignation" ? results.afpDeduction + results.isssDeduction : 0);

  for (const [key, amount] of Object.entries(results)) {
    document.querySelector(`[data-result="${key}"]`).textContent = money.format(amount);
  }
  statusLabel.textContent = "CÁLCULO ACTUALIZADO";

  calculationNote.textContent = `Bases usadas: salario diario: SBM = SBM/30.
  Asueto: SE = SBD X 2.
  Dia de descanso normal:  SDD = SBD x 1.5.
  Hora Noctuna: HN = HD x 1.25.
  Horas Extra: HE = H x HL x2.
  ${cause === "dismissal" ? "Despido injustificado: indemnización neta = salario base × años laborados - AFP (7.25 %) - ISSS (3 %). Los descuentos se detallan aparte y no vuelven a restarse del total." : "Renuncia: AFP (7.25 %) e ISSS (3 %) se calculan sobre salario × años laborados y se restan del total."}
  AFP: ${afpDeduction.toFixed(2)}; ISSS: ${isssDeduction.toFixed(2)}.
  Aguinaldo: ${aguinaldo.toFixed(2)}; escala anual de 15, 19 o 21 días según antigüedad, proporcional desde el 1 de octubre anterior cuando la terminación ocurre antes del 1 de octubre.
  Vacaciones proporcionales: ${vacationProportional.toFixed(2)}; 15 días de salario más 30 %, prorrateados desde la última jornada vacacional o desde el ingreso si no hubo vacaciones anteriores.`;
}

function validateForm() {
  updateEmploymentDateLimits();
  const cause = form.querySelector('input[name="cause"]:checked').value;
  const requiredFields = [...form.querySelectorAll("input[required]")].filter((field) => !field.disabled && !field.closest("[hidden]") && !field.closest("[disabled]"));
  const invalid = requiredFields.find((field) => !field.checkValidity());
  const invalidEmploymentPeriod = employmentStart.value && employmentEnd.value && employmentStart.value > employmentEnd.value;
  const monthsField = form.elements.months;
  const extraDaysField = form.elements["extra-days"];
  const invalidServicePeriod = [monthsField, extraDaysField].find((field) => !field.checkValidity());
  const numericFields = [...form.querySelectorAll('input[type="number"]')];
  const invalidNumber = numericFields.find((field) => field.value !== "" && (!Number.isFinite(Number(field.value)) || Number(field.value) < 0));
  const employeeType = form.querySelector('input[name="employee-type"]:checked');
  const jobTitle = form.elements["job-title"];
  const complianceSelected = form.querySelector('input[name="resignation-compliance"]:checked');

  if (invalidEmploymentPeriod) {
    formError.textContent = "La fecha de finalización debe ser igual o posterior a la fecha de inicio.";
    employmentEnd.focus();
    return false;
  }

  if (cause === "dismissal" && employmentEnd.value > localDateValue()) {
    formError.textContent = "Para despido injustificado, la fecha de finalización no puede ser posterior a hoy.";
    employmentEnd.focus();
    return false;
  }

  if (cause === "resignation" && (!employeeType || !jobTitle.value.trim() || !complianceSelected)) {
    formError.textContent = "Selecciona el tipo de empleado, indica el cargo y responde Sí o No sobre las condiciones legales.";
    const missingField = !employeeType
      ? form.querySelector('input[name="employee-type"]')
      : !jobTitle.value.trim()
        ? jobTitle
        : form.querySelector('input[name="resignation-compliance"]');
    missingField.focus();
    return false;
  }

  if (invalid || invalidNumber || invalidServicePeriod) {
    formError.textContent = "Revisa los datos: deben ser valores válidos y no negativos; los meses van de 0 a 11 y los días de 0 a 29.";
    (invalid || invalidNumber || invalidServicePeriod || monthsField).focus();
    return false;
  }
  formError.textContent = "";
  return true;
}

form.addEventListener("focusin", updateEmploymentDateLimits);
form.querySelectorAll('input[name="employment-start"], input[name="employment-end"]').forEach((input) => {
  input.addEventListener("change", () => {
    updateEmploymentDateLimits();
    updateServicePeriod();
    updateHolidaySelection();
    if (lastVacationStart.value && (lastVacationStart.value < lastVacationStart.min || lastVacationStart.value > lastVacationStart.max)) {
      lastVacationStart.value = "";
    }
    updateVacationRestDay();
    if (statusLabel.textContent === "CÁLCULO ACTUALIZADO" && validateForm()) calculate();
  });
});

lastVacationStart.addEventListener("change", updateVacationRestDay);

noPreviousVacation.addEventListener("change", () => {
updateVacationRestDay();
if (statusLabel.textContent === "CÁLCULO ACTUALIZADO" && validateForm()) calculate();
});

form.querySelectorAll('input[name="vacation-paid"]').forEach((input) => {
  input.addEventListener("change", () => {
    const vacationWasPaid = form.querySelector('input[name="vacation-paid"]:checked').value === "yes";
    vacationDetails.hidden = vacationWasPaid;
    vacationDetails.disabled = vacationWasPaid;
    if (statusLabel.textContent === "CÁLCULO ACTUALIZADO" && validateForm()) calculate();
  });
});

form.querySelectorAll('input[name="worked-holidays"]').forEach((input) => {
  input.addEventListener("change", () => {
    updateWorkedHolidayFields();
    if (statusLabel.textContent === "CÁLCULO ACTUALIZADO" && validateForm()) calculate();
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (validateForm()) calculate();
});

form.addEventListener("input", () => {
  if (statusLabel.textContent === "CÁLCULO ACTUALIZADO" && validateForm()) calculate();
});

form.querySelectorAll('input[name="cause"]').forEach((input) => {
  input.addEventListener("change", () => {
    updateResignationFields();
    updateEmploymentDateLimits();
    updateHolidaySelection();
    if (statusLabel.textContent === "CÁLCULO ACTUALIZADO" && validateForm()) calculate();
  });
});

form.querySelectorAll('input[name="employee-type"], input[name="resignation-compliance"]').forEach((input) => {
  input.addEventListener("change", () => {
    updateResignationFields();
    if (statusLabel.textContent === "CÁLCULO ACTUALIZADO" && validateForm()) calculate();
  });
});

noExtras.addEventListener("change", () => {
  updateResignationFields();
  if (statusLabel.textContent === "CÁLCULO ACTUALIZADO" && validateForm()) calculate();
});

document.querySelector("#print-button").addEventListener("click", () => window.print());

window.addEventListener("beforeprint", () => {
  const workerName = document.querySelector("#worker-name").value.trim();
  const showWorkerName = form.querySelector('input[name="anonymous-data"]:checked').value === "no";
  document.querySelector("#print-worker-name").textContent = workerName
    ? showWorkerName ? `Trabajador: ${workerName}` : "Trabajador: ████████████"
    : "";
});

updateResignationFields();
updateEmploymentDateLimits();
updateHolidaySelection();
updateWorkedHolidayFields();
updateVacationRestDay();
scheduleEmploymentDateLimitRefresh();
