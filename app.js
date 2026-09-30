const form = document.querySelector("#calculator");
const formError = document.querySelector("#form-error");
const noExtras = document.querySelector("#no-extras");
const extrasGrid = document.querySelector(".extras-grid");
const extrasFields = document.querySelector("#extras-fields");
const extrasLockedNote = document.querySelector("#extras-locked-note");
const resignationDetails = document.querySelector("#resignation-details");
const resignationNotice = document.querySelector("#resignation-notice");
const statusLabel = document.querySelector("#result-status");
const calculationNote = document.querySelector("#calculation-note");
const employmentStart = document.querySelector("#employment-start");
const employmentEnd = document.querySelector("#employment-end");
const holidayDaysInput = document.querySelector("#holiday-days");
const holidayCalendarMonthLabel = document.querySelector("#holiday-calendar-month");
const holidayCalendarDays = document.querySelector("#holiday-calendar-days");
const holidaySelectionCount = document.querySelector("#holiday-selection-count");
const holidayPreviousMonth = document.querySelector("#holiday-previous-month");
const holidayNextMonth = document.querySelector("#holiday-next-month");
const selectedHolidayDates = new Set();
const numberValue = (name) => Number(new FormData(form).get(name) || 0);
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const holidayMonthFormatter = new Intl.DateTimeFormat("es-SV", { month: "long", year: "numeric" });
const holidayDateFormatter = new Intl.DateTimeFormat("es-SV", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
let holidayCalendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

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

function isHolidayDateAllowed(dateValue) {
  return dateValue <= latestHolidayDateValue() && (!employmentStart.value || dateValue >= employmentStart.value);
}

function renderHolidayCalendar() {
  const year = holidayCalendarMonth.getFullYear();
  const month = holidayCalendarMonth.getMonth();
  const visibleMonthValue = `${year}-${String(month + 1).padStart(2, "0")}`;
  const latestMonthValue = latestHolidayDateValue().slice(0, 7);
  const firstEmploymentMonth = employmentStart.value ? employmentStart.value.slice(0, 7) : "";
  holidayCalendarMonthLabel.textContent = holidayMonthFormatter.format(holidayCalendarMonth);
  holidayPreviousMonth.disabled = Boolean(firstEmploymentMonth && visibleMonthValue <= firstEmploymentMonth);
  holidayNextMonth.disabled = visibleMonthValue >= latestMonthValue;
  holidayCalendarDays.replaceChildren();

  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = localDateValue();

  for (let cell = 0; cell < 42; cell += 1) {
    const day = cell - firstWeekday + 1;
    if (day < 1 || day > daysInMonth) {
      const emptyCell = document.createElement("span");
      emptyCell.className = "holiday-day-empty";
      emptyCell.setAttribute("aria-hidden", "true");
      holidayCalendarDays.append(emptyCell);
      continue;
    }

    const date = new Date(year, month, day);
    const dateValue = localDateValue(date);
    const isSelected = selectedHolidayDates.has(dateValue);
    const dayButton = document.createElement("button");
    dayButton.type = "button";
    dayButton.className = "holiday-day";
    dayButton.textContent = String(day);
    dayButton.disabled = !isHolidayDateAllowed(dateValue);
    dayButton.classList.toggle("is-today", dateValue === today);
    dayButton.classList.toggle("is-selected", isSelected);
    dayButton.setAttribute("aria-pressed", String(isSelected));
    dayButton.setAttribute("aria-label", `${holidayDateFormatter.format(date)}${isSelected ? ", seleccionado" : ""}`);
    dayButton.addEventListener("click", () => {
      if (selectedHolidayDates.has(dateValue)) selectedHolidayDates.delete(dateValue);
      else selectedHolidayDates.add(dateValue);
      updateHolidaySelection();
      if (statusLabel.textContent === "CÁLCULO ACTUALIZADO" && validateForm()) calculate();
    });
    holidayCalendarDays.append(dayButton);
  }
}

function updateHolidaySelection() {
  for (const dateValue of selectedHolidayDates) {
    if (!isHolidayDateAllowed(dateValue)) selectedHolidayDates.delete(dateValue);
  }
  const count = selectedHolidayDates.size;
  holidayDaysInput.value = String(count);
  holidaySelectionCount.textContent = `${count} ${count === 1 ? "día seleccionado" : "días seleccionados"}`;
  renderHolidayCalendar();
}

function updateEmploymentDateLimits() {
  const today = localDateValue();
  const isResignation = form.querySelector('input[name="cause"]:checked').value === "resignation";
  employmentStart.max = today;
  employmentEnd.max = isResignation ? "" : today;
  employmentEnd.min = employmentStart.value || "";
  employmentStart.min = "";
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

function updateResignationFields() {
  const cause = form.querySelector('input[name="cause"]:checked').value;
  const isResignation = cause === "resignation";
  resignationDetails.hidden = !isResignation;
  resignationDetails.disabled = !isResignation;
  document.querySelector("#indemnity-row").hidden = !isResignation;

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
  const hourlySalary = dailySalary / 8;
  const results = {
    /*indemnity,*/
    dayOvertime: dayHours * hourlySalary * 2,
    nightOvertime: nightHours * hourlySalary * 2 * 1.25,
    holiday: holidayDays * dailySalary * 2,
    rest: restDays * dailySalary * 1.5
  };
  for (const key of Object.keys(results)) {
    results[key] = Math.round((results[key] + Number.EPSILON) * 100) / 100;
  }
  results.total = Object.values(results).reduce((sum, value) => sum + value, 0);

  for (const [key, amount] of Object.entries(results)) {
    document.querySelector(`[data-result="${key}"]`).textContent = money.format(amount);
  }
  statusLabel.textContent = "CÁLCULO ACTUALIZADO";

  calculationNote.textContent = `Bases usadas: salario diario: SBM = SBM/30.
  Asueto: SE = SBD X 2.
  Dia de descanso normal:  SDD = SBD x 1.5.
  Hora Noctuna: HN = HD x 1.25.
  Horas Extra: HE = H x HL x2.`;
}

function validateForm() {
  updateEmploymentDateLimits();
  const cause = form.querySelector('input[name="cause"]:checked').value;
  const requiredFields = [...form.querySelectorAll("input[required]")];
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
    const calendarDate = latestHolidayDateValue().split("-").map(Number);
    holidayCalendarMonth = new Date(calendarDate[0], calendarDate[1] - 1, 1);
    updateHolidaySelection();
    if (statusLabel.textContent === "CÁLCULO ACTUALIZADO" && validateForm()) calculate();
  });
});

holidayPreviousMonth.addEventListener("click", () => {
  holidayCalendarMonth.setMonth(holidayCalendarMonth.getMonth() - 1);
  renderHolidayCalendar();
});

holidayNextMonth.addEventListener("click", () => {
  holidayCalendarMonth.setMonth(holidayCalendarMonth.getMonth() + 1);
  renderHolidayCalendar();
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
    const calendarDate = latestHolidayDateValue().split("-").map(Number);
    holidayCalendarMonth = new Date(calendarDate[0], calendarDate[1] - 1, 1);
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
scheduleEmploymentDateLimitRefresh();
