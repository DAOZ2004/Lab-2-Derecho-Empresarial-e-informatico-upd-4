# Calculadora de prestaciones laborales

Aplicación educativa en HTML, CSS y JavaScript puro para estimar prestaciones y recargos laborales en El Salvador. Los cálculos se realizan en el navegador; no se transmiten datos.

## Uso local

Abre `index.html` en un navegador moderno. El formulario carga un ejemplo editable al iniciar; reemplaza los datos antes de usarlo. El botón «Imprimir resultado» permite imprimir el desglose.


## Supuestos que deben revisarse

- La base anual para prorratear se considera de 360 días y los meses equivalen a 30 días.
- El salario mínimo mensual predeterminado es editable; confirma el valor vigente y la actividad económica que corresponde antes de utilizar la estimación.
- La compensación por renuncia usa dos salarios mínimos mensuales como base y requiere dos años de servicio. Los topes y fracciones deben contrastarse con la legislación vigente.
- El aguinaldo por despido usa una escala estimada de 15, 19 o 21 días de salario según antigüedad; si la fecha de finalización es anterior al 1 de octubre, se prorratea desde el 1 de octubre previo hasta el despido. Confirma la base legal y el período aplicable al caso concreto.
- El apartado pregunta si las vacaciones ya fueron pagadas y solo si la respuesta es No registra la fecha de inicio de la última jornada vacacional, además de si alojamiento y comida están incluidos en el contrato y si se pudieron proporcionar durante las vacaciones. Como referencia, muestra el séptimo día al sumar seis días a la fecha elegida; verifica el ciclo laboral y el descanso semanal real.
- Si las vacaciones no fueron pagadas, el resultado incluye un estimado proporcional de 15 días de salario más 30 %, desde la fecha de la última jornada vacacional; si nunca hubo vacaciones anteriores, desde el ingreso. Se cuentan períodos anuales completos y la parte proporcional del período en curso. Se aumenta 25 % por cada prestación contractual (alojamiento o comida) que no se pudo proporcionar durante las vacaciones. Si ya fueron pagadas, el saldo mostrado es cero. Confirma la base legal y el período exacto.
- En despido injustificado y renuncia voluntaria, AFP (7.25 %) e ISSS (3 %) se muestran como descuentos separados en el desglose. Se calculan sobre salario × años laborados; para despido ya están restados de la indemnización neta, y para renuncia se restan del total. Confirma tasas, bases y topes vigentes para el caso concreto.
- El aguinaldo se incluye en los resultados tanto para despido como para renuncia, usando la escala estimada de 15, 19 o 21 días y el prorrateo descrito arriba.
- Asueto y descanso semanal muestran el pago adicional sobre el salario ordinario mensual. Para asuetos, la lista presenta las fechas nacionales aplicables al período laboral y permite seleccionar los días trabajados; verifica que cada fecha aplique al caso concreto. No se incluyen ISR, salarios pendientes ni otras prestaciones.

El comprobante de referencia entregado no es una tabla de fórmulas y algunos importes no se pueden reconstruir sin datos adicionales. La herramienta no sustituye asesoría legal.
