const form=document.querySelector("#calculator");
const formError=document.querySelector("#form-error");
const noExtras=document.querySelector("#no-extras");
const extrasGrid=document.querySelector(".extras-grid");
const extrasFields=document.querySelector("#extras-fields");
const extrasLockedNote=document.querySelector("#extras-locked-note");
const dismissalIndemnityPanel=document.querySelector("#dismissal-indemnity-panel");
const dismissalIndemnityInput=document.querySelector("#dismissal-indemnity");
const aguinaldoInput=document.querySelector("#aguinaldo");
const aguinaldoField=document.querySelector("#aguinaldo-field");
const resignationDetails=document.querySelector("#resignation-details");
const resignationNotice=document.querySelector("#resignation-notice");
const statusLabel=document.querySelector("#result-status");
const calculationNote=document.querySelector("#calculation-note");
const legalBase=document.querySelector("#legal-base");
const legalDismissalMessage=document.querySelector("#legal-dismissal-message");
const legalResignationMessage=document.querySelector("#legal-resignation-message");
const legalReferences={
  dayOvertime:"legal-day-overtime",
  nightOvertime:"legal-night-overtime",
  aguinaldo:"legal-aguinaldo",
  vacationProportional:"legal-vacation",
  holiday:"legal-holiday",
  rest:"legal-rest"
};
const employmentStart=document.querySelector("#employment-start");
const employmentEnd=document.querySelector("#employment-end");
const holidayDaysInput=document.querySelector("#holiday-days");
const holidayListContainer=document.querySelector("#holiday-list-container");
const holidayList=document.querySelector("#holiday-list");
const holidayListEmpty=document.querySelector("#holiday-list-empty");
const holidaySelectionCount=document.querySelector("#holiday-selection-count");
const vacationDetails=document.querySelector("#vacation-details");
const lastVacationStart=document.querySelector("#last-vacation-start");
const noPreviousVacation=document.querySelector("#no-previous-vacation");
const vacationRestDay=document.querySelector("#vacation-rest-day");
const dayHoursInput=document.querySelector("#day-hours");
const nightHoursInput=document.querySelector("#night-hours");
const restDaysInput=document.querySelector("#rest-days");
const selectedHolidayDates=new Set();

const numberValue=name=>Number(new FormData(form).get(name)||0);

const money=new Intl.NumberFormat("en-US",{
  style:"currency",
  currency:"USD"
});

const holidayDateFormatter=new Intl.DateTimeFormat("es-SV",{
  weekday:"long",
  day:"numeric",
  month:"long",
  year:"numeric"
});


/* =========================================================
   FECHAS
========================================================= */

function localDateValue(date=new Date()){
  const year=date.getFullYear();
  const month=String(date.getMonth()+1).padStart(2,"0");
  const day=String(date.getDate()).padStart(2,"0");
  return `${year}-${month}-${day}`;
}

function latestHolidayDateValue(){
  const today=localDateValue();
  const cause=form.querySelector('input[name="cause"]:checked')?.value;
  const isResignation=cause==="resignation";

  if(isResignation&&employmentEnd.value)return employmentEnd.value;

  return employmentEnd.value&&employmentEnd.value<today
    ?employmentEnd.value
    :today;
}


/* =========================================================
   ASUETOS
========================================================= */

function easterSunday(year){
  const a=year%19;
  const b=Math.floor(year/100);
  const c=year%100;
  const d=Math.floor(b/4);
  const e=b%4;
  const f=Math.floor((b+8)/25);
  const g=Math.floor((b-f+1)/3);
  const h=(19*a+b-d-g+15)%30;
  const i=Math.floor(c/4);
  const k=c%4;
  const l=(32+2*e+2*i-h-k)%7;
  const m=Math.floor((a+11*h+22*l)/451);
  const month=Math.floor((h+l-7*m+114)/31);
  const day=((h+l-7*m+114)%31)+1;
  return new Date(year,month-1,day);
}

function holidaysForYear(year){
  const easter=easterSunday(year);

  const holidays=[
    ["Año Nuevo",new Date(year,0,1)],
    ["Jueves Santo",new Date(year,easter.getMonth(),easter.getDate()-3)],
    ["Viernes Santo",new Date(year,easter.getMonth(),easter.getDate()-2)],
    ["Sábado Santo",new Date(year,easter.getMonth(),easter.getDate()-1)],
    ["Día del Trabajo",new Date(year,4,1)],
    ["Día de la Madre",new Date(year,4,10)],
    ["Día del Padre",new Date(year,5,17)],
    ["Día del Divino Salvador del Mundo",new Date(year,7,6)],
    ["Día de la Independencia",new Date(year,8,15)],
    ["Día de los Difuntos",new Date(year,10,2)],
    ["Asueto del 21 de noviembre",new Date(year,10,21)],
    ["Navidad",new Date(year,11,25)]
  ];

  return holidays.map(([name,date])=>({
    name,
    dateValue:localDateValue(date)
  }));
}


/* =========================================================
   JORNADAS ESPECIALES
========================================================= */

function specialDaysAreLocked(){
  const cause=form.querySelector('input[name="cause"]:checked')?.value;
  const compliance=form.querySelector(
    'input[name="resignation-compliance"]:checked'
  )?.value;

  return noExtras.checked||
    (cause==="resignation"&&compliance==="no");
}

function renderHolidayList(){
  const startDate=employmentStart.value;
  const endDate=latestHolidayDateValue();

  holidayList.replaceChildren();

  if(!startDate||!endDate||startDate>endDate){
    holidayListEmpty.textContent=
      "Indica las fechas de inicio y finalización de labores para mostrar los asuetos del período.";
    holidayListEmpty.hidden=false;
    return;
  }

  const holidays=[];

  for(
    let year=Number(startDate.slice(0,4));
    year<=Number(endDate.slice(0,4));
    year++
  ){
    holidays.push(
      ...holidaysForYear(year).filter(
        ({dateValue})=>
          dateValue>=startDate&&dateValue<=endDate
      )
    );
  }

  holidays.sort((a,b)=>a.dateValue.localeCompare(b.dateValue));

  holidayListEmpty.hidden=holidays.length>0;

  if(!holidays.length){
    holidayListEmpty.textContent=
      "No hay días de asueto nacionales dentro del período indicado.";
    return;
  }

  const locked=specialDaysAreLocked();

  for(const {name,dateValue} of holidays){
    const date=new Date(`${dateValue}T00:00:00`);
    const label=document.createElement("label");
    label.className="holiday-option";

    const checkbox=document.createElement("input");
    checkbox.type="checkbox";
    checkbox.name="holiday-date";
    checkbox.value=dateValue;
    checkbox.checked=selectedHolidayDates.has(dateValue);
    checkbox.disabled=locked;

    const text=document.createElement("span");
    text.textContent=
      `${name} — ${holidayDateFormatter.format(date)}`;

    checkbox.addEventListener("change",()=>{
      if(checkbox.checked)selectedHolidayDates.add(dateValue);
      else selectedHolidayDates.delete(dateValue);

      updateHolidaySelection();

      if(
        statusLabel.textContent==="CÁLCULO ACTUALIZADO"&&
        validateForm()
      )calculate();
    });

    label.append(checkbox,text);
    holidayList.append(label);
  }
}

function updateHolidaySelection(){
  const startDate=employmentStart.value;
  const endDate=latestHolidayDateValue();

  for(const dateValue of selectedHolidayDates){
    if(
      !startDate||
      !endDate||
      dateValue<startDate||
      dateValue>endDate
    ){
      selectedHolidayDates.delete(dateValue);
    }
  }

  const count=selectedHolidayDates.size;

  holidayDaysInput.value=
    specialDaysAreLocked()?"0":String(count);

  holidaySelectionCount.textContent=
    `${count} ${count===1?"día seleccionado":"días seleccionados"}`;

  renderHolidayList();
}

function updateWorkedHolidayFields(){
  const workedHolidayInputs=
    form.querySelectorAll('input[name="worked-holidays"]');

  const workedHolidays=
    form.querySelector(
      'input[name="worked-holidays"]:checked'
    )?.value;

  const locked=specialDaysAreLocked();

  workedHolidayInputs.forEach(input=>{
    input.disabled=locked;
  });

  holidayListContainer.hidden=
    locked||workedHolidays!=="yes";

  if(locked||workedHolidays!=="yes"){
    selectedHolidayDates.clear();
    holidayDaysInput.value="0";
    holidaySelectionCount.textContent="0 días seleccionados";
  }

  holidayDaysInput.disabled=locked;

  renderHolidayList();
}

function updateSpecialDayControlState(){
  const locked=specialDaysAreLocked();

  dayHoursInput.disabled=locked;
  nightHoursInput.disabled=locked;
  restDaysInput.disabled=locked;
  holidayDaysInput.disabled=locked;

  if(locked){
    selectedHolidayDates.clear();
    holidayDaysInput.value="0";
    holidaySelectionCount.textContent="0 días seleccionados";
  }

  updateWorkedHolidayFields();
}


/* =========================================================
   LÍMITES DE FECHAS
========================================================= */

function updateEmploymentDateLimits(){
  const today=localDateValue();
  const cause=form.querySelector('input[name="cause"]:checked')?.value;
  const isResignation=cause==="resignation";

  employmentStart.max=today;
  employmentEnd.max=isResignation?"":today;
  employmentEnd.min=employmentStart.value||"";
  employmentStart.min="";

  lastVacationStart.min=employmentStart.value||"";

  lastVacationStart.max=isResignation
    ?(employmentEnd.value||today)
    :([employmentEnd.value,today].filter(Boolean).sort()[0]||today);
}

function scheduleEmploymentDateLimitRefresh(){
  updateEmploymentDateLimits();

  setInterval(()=>{
    updateEmploymentDateLimits();
  },60000);
}


/* =========================================================
   VACACIONES
========================================================= */

function updateVacationRestDay(){
  lastVacationStart.disabled=noPreviousVacation.checked;
  lastVacationStart.required=!noPreviousVacation.checked;

  if(noPreviousVacation.checked){
    vacationRestDay.textContent=
      "No se registra una jornada anterior; para el cálculo proporcional se usará la fecha de ingreso.";
    return;
  }

  if(!lastVacationStart.value){
    vacationRestDay.textContent=
      "Selecciona la fecha de inicio para identificar el séptimo día de descanso.";
    return;
  }

  const [year,month,day]=lastVacationStart.value.split("-").map(Number);

  const seventhDay=new Date(
    year,
    month-1,
    day+6
  );

  vacationRestDay.textContent=
    `Tomando el inicio de la jornada vacacional como día 1, el séptimo día (descanso semanal) corresponde al ${holidayDateFormatter.format(seventhDay)}.`;
}


/*
FÓRMULA DE VACACIONES:
Vacación completa = salario diario × 15 × 1.30

Si alojamiento o alimentación fueron pactados y no pueden
proporcionarse durante las vacaciones:
+25 % por cada prestación.

Vacación proporcional =
vacación completa × días trabajados del período / 360.
*/

function commercialDateDifferenceInclusive(startDate,endDate){
  const [startYear,startMonth,startDay]=startDate.split("-").map(Number);
  const [endYear,endMonth,endDay]=endDate.split("-").map(Number);

  return(
    (endYear-startYear)*360+
    (endMonth-startMonth)*30+
    (endDay-startDay)+1
  );
}

function calculateVacationProportional(salary){
  const vacationPaid=
    form.querySelector(
      'input[name="vacation-paid"]:checked'
    )?.value;

  if(vacationPaid!=="no")return 0;

  const endDate=employmentEnd.value;
  if(!endDate)return 0;

  /*
  El material utiliza el período vacacional del año en curso.
  Por eso se toma el 1 de enero del año de terminación.
  */
  const endYear=Number(endDate.slice(0,4));
  const accrualStart=`${endYear}-01-01`;

  const accruedDays=Math.min(
    Math.max(
      commercialDateDifferenceInclusive(
        accrualStart,
        endDate
      ),
      0
    ),
    360
  );

  const dailySalary=salary/30;

  const accommodationUnavailable=
    form.querySelector(
      'input[name="accommodation-status"]:checked'
    )?.value==="included-not-provided";

  const mealsUnavailable=
    form.querySelector(
      'input[name="meals-status"]:checked'
    )?.value==="included-not-provided";

  const additionalBenefits=
    Number(accommodationUnavailable)+
    Number(mealsUnavailable);

  const fullVacation=
    dailySalary*
    15*
    (
      1.30+
      additionalBenefits*0.25
    );

  const vacationDaily=
    Math.floor((fullVacation/360)*1000)/1000;

  return vacationDaily*accruedDays;
}


/* =========================================================
   AGUINALDO
========================================================= */

/*
FÓRMULA DE AGUINALDO:
Menos de 3 años = salario diario × 15 días.
De 3 a 10 años = salario diario × 19 días.
Más de 10 años = salario diario × 21 días.

Proporcional:
aguinaldo completo × días proporcionales / 360.

El caso del material utiliza como referencia el 12 de diciembre.
*/

function calculateAguinaldo(salary,serviceDays){
  const startDate=employmentStart.value;
  const endDate=employmentEnd.value;

  if(!startDate||!endDate||startDate>endDate)return 0;

  const serviceYears=serviceDays/360;

  const bonusDays=
    serviceYears>10
      ?21
      :serviceYears>=3
        ?19
        :15;

  const dailySalary=salary/30;

  const endYear=Number(endDate.slice(0,4));

  const paymentDateThisYear=`${endYear}-12-12`;
  const paymentDatePreviousYear=`${endYear-1}-12-12`;

  const referenceDate=
    endDate>=paymentDateThisYear
      ?paymentDateThisYear
      :paymentDatePreviousYear;

  const accrualStart=
    startDate>referenceDate
      ?startDate
      :referenceDate;

  const accruedDays=Math.min(
    Math.max(
      commercialDateDifferenceInclusive(
        accrualStart,
        endDate
      ),
      0
    ),
    360
  );

  const fullAguinaldo=dailySalary*bonusDays;

  /*
  El ejemplo obtiene:
  $380 / 360 = $1.055 diarios
  $1.055 × 289 días = $304.895 ≈ $304.90
  */
  const aguinaldoDaily=
    Math.floor((fullAguinaldo/360)*1000)/1000;

  return aguinaldoDaily*accruedDays;
}


/* =========================================================
   DIFERENCIA DE FECHAS
========================================================= */

function dateDifferenceInDays(startDate,endDate){
  const [startYear,startMonth,startDay]=startDate.split("-").map(Number);
  const [endYear,endMonth,endDay]=endDate.split("-").map(Number);

  const startUtc=Date.UTC(
    startYear,
    startMonth-1,
    startDay
  );

  const endUtc=Date.UTC(
    endYear,
    endMonth-1,
    endDay
  );

  return(endUtc-startUtc)/86400000;
}


/* =========================================================
   ANTIGÜEDAD
========================================================= */

function updateServicePeriod(){
  if(
    !employmentStart.value||
    !employmentEnd.value||
    employmentStart.value>employmentEnd.value
  )return;

  const [startYear,startMonth,startDay]=
    employmentStart.value.split("-").map(Number);

  /*
  Se utiliza año comercial de 360 días y mes comercial de 30 días.

  Se considera como fecha final exclusiva el día siguiente
  al último día laborado.

  Ejemplo:
  01/01/2015 → 30/09/2021
  = 6 años, 9 meses, 0 días.
  */

  const endDateExclusive=
    new Date(`${employmentEnd.value}T00:00:00`);

  endDateExclusive.setDate(
    endDateExclusive.getDate()+1
  );

  const endYear=endDateExclusive.getFullYear();
  const endMonth=endDateExclusive.getMonth()+1;
  const endDay=endDateExclusive.getDate();

  let years=endYear-startYear;
  let months=endMonth-startMonth;
  let days=endDay-startDay;

  if(days<0){
    months--;
    days+=30;
  }

  if(months<0){
    years--;
    months+=12;
  }

  form.elements.years.value=Math.max(years,0);
  form.elements.months.value=Math.max(months,0);
  form.elements["extra-days"].value=Math.max(days,0);
}

function countServiceDays(){
  const years=numberValue("years");
  const months=numberValue("months");
  const extraDays=numberValue("extra-days");

  return years*360+months*30+extraDays;
}


/* =========================================================
   CAUSA DE TERMINACIÓN
========================================================= */

function updateResignationFields(){
  const cause=
    form.querySelector(
      'input[name="cause"]:checked'
    )?.value;

  const isResignation=cause==="resignation";
  const isDismissal=cause==="dismissal";

  const resultRow=
    document
      .querySelector(
        '[data-result="dismissalIndemnity"]'
      )
      ?.closest(".result-row");

  const resultLabel=resultRow?.querySelector("span");

  dismissalIndemnityPanel.hidden=!isDismissal;

  aguinaldoField.hidden=false;

  const aguinaldoSmall=
    aguinaldoField.querySelector("small");

  if(aguinaldoSmall){
    aguinaldoSmall.textContent=
      "Prestación proporcional según el período pendiente";
  }

  if(resultRow)resultRow.hidden=false;

  if(resultLabel){
    resultLabel.textContent=isResignation
      ?"Compensación económica por renuncia voluntaria"
      :"Indemnización por despido injustificado";
  }

  resignationDetails.hidden=!isResignation;
  resignationDetails.disabled=!isResignation;

  const employeeType=
    form.querySelector(
      'input[name="employee-type"]:checked'
    )?.value;

  if(!employeeType){
    resignationNotice.textContent=
      "Selecciona el tipo de empleado para consultar el aviso previo aplicable.";
  }else{
    const noticeDays=employeeType==="head"?30:15;
    const employeeDescription=
      employeeType==="head"
        ?"el personal de jefatura"
        :"el personal común";

    resignationNotice.textContent=
      `Según la normativa salvadoreña sobre renuncia voluntaria, ${employeeDescription} debe avisar al patrono con al menos ${noticeDays} días de anticipación para tener derecho a la compensación económica.`;
  }

  const compliance=
    form.querySelector(
      'input[name="resignation-compliance"]:checked'
    )?.value;

  const lockSpecialDays=
    isResignation&&compliance==="no";

  extrasFields.disabled=false;

  if(lockSpecialDays){
    extrasLockedNote.hidden=false;
    extrasLockedNote.textContent=
      "Las horas extras, asuetos y días de descanso semanal no se incluyen porque no se cumplen las condiciones indicadas para la renuncia.";
  }else{
    extrasLockedNote.hidden=true;
  }

  updateSpecialDayControlState();
}

function updatePrintLegalColumns(cause){
  for(const row of document.querySelectorAll(".result-row")){
    const result=row.querySelector("[data-result]");
    const legalCell=row.querySelector("[data-print-legal]");

    if(!result||!legalCell)continue;

    const legalMessageId=
      result.dataset.result==="dismissalIndemnity"
        ?cause==="resignation"
          ?"legal-resignation-message"
          :"legal-dismissal-message"
        :legalReferences[result.dataset.result];

    const legalMessage=
      legalMessageId
        ?document.getElementById(legalMessageId)
        :null;

    if(legalMessage){
      const legalReference=legalMessage.cloneNode(true);
      legalReference.querySelector("strong")?.remove();
      legalCell.textContent=legalReference.textContent.trim();
    }else{
      legalCell.textContent="";
    }
  }
}


/* =========================================================
   CÁLCULO PRINCIPAL
========================================================= */

function calculate(){
  const salary=numberValue("salary");
  const serviceDays=countServiceDays();
  const minimumWage=numberValue("minimum-wage");
  const dailySalary=salary/30;
  const cause=new FormData(form).get("cause");
  const resignationCompliance=
    new FormData(form).get("resignation-compliance");

  let causeBenefit=0;


  /*
  FÓRMULA DE INDEMNIZACIÓN POR DESPIDO INJUSTIFICADO:

  Salario × días de servicio / 360.

  Mínimo:
  15 días de salario.

  NOTA ACADÉMICA:
  El material menciona un límite de 4 salarios mínimos,
  pero el caso práctico de salario $600 calcula:
  $600 × 2430 / 360 = $4,050.

  Para reproducir el caso práctico del material,
  esta calculadora utiliza directamente el salario.
  */

  if(cause==="dismissal"){
    const proportionalIndemnity=
      salary*(serviceDays/360);

    const minimumIndemnity=
      salary*15/30;

    causeBenefit=Math.max(
      proportionalIndemnity,
      minimumIndemnity
    );

    dismissalIndemnityInput.value=
      money.format(causeBenefit);
  }


  /*
  FÓRMULA DE RENUNCIA VOLUNTARIA:

  15 días de salario por cada año trabajado,
  proporcional por fracciones.

  Salario considerado:
  mínimo entre salario real y 2 salarios mínimos.

  Requisito:
  al menos 2 años = 720 días comerciales.
  */

  if(
    cause==="resignation"&&
    resignationCompliance==="yes"&&
    serviceDays>=720
  ){
    const resignationSalary=
      Math.min(
        salary,
        minimumWage*2
      );

    const resignationDailySalary=
    resignationSalary/30;  

    causeBenefit=
      resignationDailySalary*
      15*
      (serviceDays/360);
  }

  if(cause==="resignation"){
    dismissalIndemnityInput.value=
      money.format(0);
  }


  /* =======================================================
     JORNADAS ESPECIALES
  ======================================================= */

  const extrasUnavailable=specialDaysAreLocked();

  const dayHours=
    extrasUnavailable?0:numberValue("day-hours");

  const nightHours=
    extrasUnavailable?0:numberValue("night-hours");

  const holidayDays=
    extrasUnavailable?0:numberValue("holiday-days");

  const restDays=
    extrasUnavailable?0:numberValue("rest-days");


  const aguinaldo=
    calculateAguinaldo(
      salary,
      serviceDays
    );

  const vacationProportional=
    calculateVacationProportional(
      salary
    );

  aguinaldoInput.value=
    money.format(aguinaldo);


  /*
  FÓRMULAS DE HORAS Y DÍAS ESPECIALES:

  Salario horario = salario diario / 8.

  Hora extra diurna =
  horas × salario horario × 2.

  Hora extra nocturna =
  horas × salario horario × 2 × 1.25.

  Día de asueto =
  días × salario diario × 2.

  Día de descanso semanal =
  días × salario diario × 1.5.
  */

  const hourlySalary=dailySalary/8;

  const dayOvertime=
    dayHours*hourlySalary*2;

  const nightOvertime=
    nightHours*hourlySalary*2*1.25;

  const holiday=
    holidayDays*dailySalary*2;

  const rest=
    restDays*dailySalary*1.5;


  /*
  REMUNERACIÓN GRAVADA:
  vacaciones + horas extra + asuetos + descanso semanal.

  Indemnización y aguinaldo se mantienen separados.
  */

  const remunerationGravada=
    vacationProportional+
    dayOvertime+
    nightOvertime+
    holiday+
    rest;


  /*
  FÓRMULA AFP:
  remuneración gravada × 7.25 %.
  */

  const afpDeduction=
    remunerationGravada*0.0725;


  /*
  FÓRMULA ISSS:
  base máxima considerada = $1,000.
  ISSS = base × 3 %.
  */

  const isssBase=
    Math.min(
      remunerationGravada,
      1000
    );

  const isssDeduction=
    isssBase*0.03;


  const results={
    dayOvertime,
    nightOvertime,
    dismissalIndemnity:causeBenefit,
    afpDeduction:-afpDeduction,
    isssDeduction:-isssDeduction,
    aguinaldo,
    vacationProportional,
    holiday,
    rest
  };

  for(const key of Object.keys(results)){
    results[key]=Math.round(
      (results[key]+Number.EPSILON)*100
    )/100;
  }


  /*
  TOTAL BRUTO:
  indemnización/renuncia
  + aguinaldo
  + vacaciones
  + horas extras
  + asuetos
  + descanso semanal.

  AFP e ISSS NO se descuentan del total bruto.
  */

  results.total=
    results.dayOvertime+
    results.nightOvertime+
    results.holiday+
    results.rest+
    results.dismissalIndemnity+
    results.aguinaldo+
    results.vacationProportional;

  results.total=Math.round(
    (results.total+Number.EPSILON)*100
  )/100;


  for(const [key,amount] of Object.entries(results)){
    const element=
      document.querySelector(
        `[data-result="${key}"]`
      );

    if(element){
      element.textContent=
        money.format(amount);
    }
  }

  statusLabel.textContent="CÁLCULO ACTUALIZADO";

  if(legalBase){
  legalBase.hidden=false;
  }

  const currentCause =
  form.querySelector('input[name="cause"]:checked')?.value;

 if(legalDismissalMessage){
  legalDismissalMessage.hidden =
    currentCause !== "dismissal";
  }

  if(legalResignationMessage){
  legalResignationMessage.hidden =
    currentCause !== "resignation";
  }

  updatePrintLegalColumns(currentCause);


  const causeText=
    cause==="dismissal"
      ?`Indemnización por despido injustificado: 30 días de salario por cada año y proporcional por fracciones, con mínimo de 15 días. Para reproducir el caso académico se utiliza el salario completo.`
      :`Renuncia voluntaria: compensación económica de 15 días de salario por año, proporcional por fracciones, condicionada a 2 años mínimos de servicio y al cumplimiento de las condiciones legales.`;

  calculationNote.textContent=
    `Bases usadas:

Salario diario = salario mensual / 30.

${causeText}

Horas extras diurnas = horas × salario horario × 2.

Horas extras nocturnas = horas × salario horario × 2 × 1.25.

Asueto laborado = salario diario × 2.

Día de descanso semanal = salario diario × 1.5.

Aguinaldo = salario diario × días de aguinaldo, proporcional sobre 360 días. La referencia del 12 de diciembre corresponde al ejemplo del material.

Vacaciones = salario diario × 15 × 1.30, proporcional al período correspondiente, con 25 % adicional por cada prestación de alojamiento o alimentación que no pueda proporcionarse.

Remuneración gravada estimada: ${remunerationGravada.toFixed(2)}.

AFP estimada: ${afpDeduction.toFixed(2)}.

ISSS estimado: ${isssDeduction.toFixed(2)}.

AFP e ISSS se muestran como deducciones informativas y no se restan del TOTAL BRUTO.

TOTAL BRUTO: ${results.total.toFixed(2)}.`;
}


/* =========================================================
   VALIDACIÓN
========================================================= */

function validateForm(){
  updateEmploymentDateLimits();

  const cause=
    form.querySelector(
      'input[name="cause"]:checked'
    )?.value;

  const requiredFields=[
    ...form.querySelectorAll("input[required]")
  ].filter(field=>
    !field.disabled&&
    !field.closest("[hidden]")&&
    !field.closest("[disabled]")
  );

  const invalid=
    requiredFields.find(
      field=>!field.checkValidity()
    );

  const invalidEmploymentPeriod=
    employmentStart.value&&
    employmentEnd.value&&
    employmentStart.value>employmentEnd.value;

  const monthsField=form.elements.months;
  const extraDaysField=form.elements["extra-days"];

  const invalidServicePeriod=[
    monthsField,
    extraDaysField
  ].find(field=>!field.checkValidity());

  const numericFields=[
    ...form.querySelectorAll(
      'input[type="number"]'
    )
  ];

  const invalidNumber=
    numericFields.find(field=>
      field.value!==""&&
      (
        !Number.isFinite(Number(field.value))||
        Number(field.value)<0
      )
    );

  const employeeType=
    form.querySelector(
      'input[name="employee-type"]:checked'
    );

  const jobTitle=
    form.elements["job-title"];

  const complianceSelected=
    form.querySelector(
      'input[name="resignation-compliance"]:checked'
    );


  if(invalidEmploymentPeriod){
    formError.textContent=
      "La fecha de finalización debe ser igual o posterior a la fecha de inicio.";
    employmentEnd.focus();
    return false;
  }

  if(
    cause==="dismissal"&&
    employmentEnd.value>localDateValue()
  ){
    formError.textContent=
      "Para despido injustificado, la fecha de finalización no puede ser posterior a hoy.";
    employmentEnd.focus();
    return false;
  }

  if(
    cause==="resignation"&&
    (
      !employeeType||
      !jobTitle.value.trim()||
      !complianceSelected
    )
  ){
    formError.textContent=
      "Selecciona el tipo de empleado, indica el cargo y responde Sí o No sobre las condiciones legales.";

    const missingField=
      !employeeType
        ?form.querySelector('input[name="employee-type"]')
        :!jobTitle.value.trim()
          ?jobTitle
          :form.querySelector(
            'input[name="resignation-compliance"]'
          );

    missingField.focus();
    return false;
  }

  if(
    invalid||
    invalidNumber||
    invalidServicePeriod
  ){
    formError.textContent=
      "Revisa los datos: deben ser valores válidos y no negativos; los meses van de 0 a 11 y los días de 0 a 29.";

    (
      invalid||
      invalidNumber||
      invalidServicePeriod||
      monthsField
    ).focus();

    return false;
  }

  formError.textContent="";
  return true;
}


/* =========================================================
   EVENTOS
========================================================= */

form.addEventListener(
  "focusin",
  updateEmploymentDateLimits
);

form.querySelectorAll(
  'input[name="employment-start"],input[name="employment-end"]'
).forEach(input=>{
  input.addEventListener("change",()=>{
    updateEmploymentDateLimits();
    updateServicePeriod();
    updateHolidaySelection();

    if(
      lastVacationStart.value&&
      (
        lastVacationStart.value<lastVacationStart.min||
        lastVacationStart.value>lastVacationStart.max
      )
    ){
      lastVacationStart.value="";
    }

    updateVacationRestDay();

    if(
      statusLabel.textContent==="CÁLCULO ACTUALIZADO"&&
      validateForm()
    ){
      calculate();
    }
  });
});


lastVacationStart.addEventListener(
  "change",
  ()=>{
    updateVacationRestDay();

    if(
      statusLabel.textContent==="CÁLCULO ACTUALIZADO"&&
      validateForm()
    ){
      calculate();
    }
  }
);


noPreviousVacation.addEventListener(
  "change",
  ()=>{
    updateVacationRestDay();

    if(
      statusLabel.textContent==="CÁLCULO ACTUALIZADO"&&
      validateForm()
    ){
      calculate();
    }
  }
);


form.querySelectorAll(
  'input[name="vacation-paid"]'
).forEach(input=>{
  input.addEventListener("change",()=>{
    const vacationWasPaid=
      form.querySelector(
        'input[name="vacation-paid"]:checked'
      )?.value==="yes";

    vacationDetails.hidden=vacationWasPaid;
    vacationDetails.disabled=vacationWasPaid;

    if(
      statusLabel.textContent==="CÁLCULO ACTUALIZADO"&&
      validateForm()
    ){
      calculate();
    }
  });
});


form.querySelectorAll(
  'input[name="accommodation-status"],input[name="meals-status"]'
).forEach(input=>{
  input.addEventListener("change",()=>{
    if(
      statusLabel.textContent==="CÁLCULO ACTUALIZADO"&&
      validateForm()
    ){
      calculate();
    }
  });
});


form.querySelectorAll(
  'input[name="worked-holidays"]'
).forEach(input=>{
  input.addEventListener("change",()=>{
    updateWorkedHolidayFields();

    if(
      statusLabel.textContent==="CÁLCULO ACTUALIZADO"&&
      validateForm()
    ){
      calculate();
    }
  });
});


form.addEventListener("submit",event=>{
  event.preventDefault();

  if(validateForm()){
    calculate();
  }
});


form.addEventListener("input",()=>{
  if(
    statusLabel.textContent==="CÁLCULO ACTUALIZADO"&&
    validateForm()
  ){
    calculate();
  }
});


form.querySelectorAll(
  'input[name="cause"]'
).forEach(input=>{
  input.addEventListener("change",()=>{
    updateResignationFields();
    updateEmploymentDateLimits();
    updateHolidaySelection();

    if(
      statusLabel.textContent==="CÁLCULO ACTUALIZADO"&&
      validateForm()
    ){
      calculate();
    }
  });
});


form.querySelectorAll(
  'input[name="employee-type"],input[name="resignation-compliance"]'
).forEach(input=>{
  input.addEventListener("change",()=>{
    updateResignationFields();

    if(
      statusLabel.textContent==="CÁLCULO ACTUALIZADO"&&
      validateForm()
    ){
      calculate();
    }
  });
});


noExtras.addEventListener("change",()=>{
  updateResignationFields();

  if(
    statusLabel.textContent==="CÁLCULO ACTUALIZADO"&&
    validateForm()
  ){
    calculate();
  }
});


const printButton=
  document.querySelector("#print-button");

if(printButton){
  printButton.addEventListener(
    "click",
    ()=>window.print()
  );
}


window.addEventListener("beforeprint", () => {

  const workerNameElement =
    document.querySelector("#worker-name");

  const employerNameElement =
    document.querySelector("#employer-name");

  const anonymousInput =
    form.querySelector(
      'input[name="anonymous-data"]:checked'
    );

  const printWorkerName =
    document.querySelector("#print-worker-name");

  const printEmployerName =
    document.querySelector("#print-employer-name");

  if (
    !workerNameElement ||
    !employerNameElement ||
    !anonymousInput
  ) return;

  const workerName =
    workerNameElement.value.trim();

  const employerName =
    employerNameElement.value.trim();

  const showPersonalData =
    anonymousInput.value === "no";


  /* =========================
     NOMBRE DEL TRABAJADOR
     ========================= */

  if (printWorkerName) {

    printWorkerName.textContent =
      workerName
        ? (
            showPersonalData
              ? `Trabajador: ${workerName}`
              : "Trabajador: ████████████"
          )
        : "";
  }


  /* =========================
     NOMBRE DE LA EMPRESA
     ========================= */

  if (printEmployerName) {

    printEmployerName.textContent =
      employerName
        ? (
            showPersonalData
              ? `Empresa / razón social: ${employerName}`
              : "Empresa / razón social: ████████████"
          )
        : "";
  }

});

/* =========================================================
   INICIALIZACIÓN
========================================================= */

updateResignationFields();
updateEmploymentDateLimits();
updateHolidaySelection();
updateWorkedHolidayFields();
updateVacationRestDay();
updateSpecialDayControlState();
scheduleEmploymentDateLimitRefresh();
