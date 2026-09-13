# ADR 0005 — Ingesta gobernada por capacidades observadas

- Estado: aceptada
- Fecha: 2026-09-13

## Contexto

Los CSV de Car Scanner mezclan señales medidas por el vehículo, cálculos de la aplicación y PIDs consultados solo de forma aislada. La presencia del nombre de un PID no demuestra cobertura suficiente para calcular una métrica. En la línea base privada, voltaje y corriente HV solo tienen una observación cada uno, mientras gasolina, velocidad y RPM forman series continuas.

## Decisión

La ingesta se divide en tres pasos:

1. Preservar registros largos válidos con PID, valor, unidad y tiempo.
2. Resolver PIDs conocidos contra un catálogo versionado sin descartar los desconocidos.
3. Publicar para cada sesión un inventario y estados `available`, `provisional` o `insufficient` por capacidad analítica.

La energía HV y la regeneración permanecen `provisional` incluso con series continuas hasta calibrar la convención de signo. Con menos de dos observaciones de corriente o voltaje quedan `insufficient`.

## Consecuencias

- El sistema no mostrará cero kWh cuando falte telemetría eléctrica.
- Los CSV nuevos pueden añadir PIDs sin romper la ingesta.
- El catálogo y el contrato se versionan independientemente del nombre del fichero.
- Las integraciones posteriores consumen capacidades declaradas, no suposiciones sobre el panel de Car Scanner.
