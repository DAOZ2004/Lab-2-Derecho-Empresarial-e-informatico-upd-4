# Calculadora de prestaciones laborales

Aplicación educativa en HTML, CSS y JavaScript puro para estimar prestaciones y recargos laborales en El Salvador. Los cálculos se realizan en el navegador; no se transmiten datos.

## Uso local

Abre `index.html` en un navegador moderno. El formulario carga un ejemplo editable al iniciar; reemplaza los datos antes de usarlo. El botón «Imprimir resultado» permite imprimir el desglose.


## Supuestos que deben revisarse

- La base anual para prorratear se considera de 360 días y los meses equivalen a 30 días.
- El salario mínimo mensual predeterminado es editable; confirma el valor vigente y la actividad económica que corresponde antes de utilizar la estimación.
- La compensación por renuncia usa dos salarios mínimos mensuales como base y requiere dos años de servicio. Los topes y fracciones deben contrastarse con la legislación vigente.
- Asueto y descanso semanal muestran el pago adicional sobre el salario ordinario mensual. No se incluyen ISSS, AFP, ISR, salarios pendientes ni otras prestaciones.

El comprobante de referencia entregado no es una tabla de fórmulas y algunos importes no se pueden reconstruir sin datos adicionales. La herramienta no sustituye asesoría legal.
