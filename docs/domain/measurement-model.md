# Modelo de medición

## Potencia eléctrica

`P_kW = V_HV × I_HV / 1000`

La convención de signo se calibra por perfil mediante aceleración y regeneración observadas. No se presupone entre vehículos.

## Energía

Se integra por trapecios entre muestras consecutivas. Los intervalos superiores al máximo configurado se excluyen; no se rellenan. Descarga y carga se acumulan por separado antes de obtener el balance.

## Combustible

`litros = integral(caudal_L_h × dt_h)`

La firma de fallo conocida de aproximadamente `154–156 L/h` se invalida mediante el umbral inicial de `50 L/h`. El umbral debe validarse por perfil de vehículo. Si un segmento contiene segundos corruptos sin cobertura alternativa, su consumo no se publica.

## Pendiente

`grade_% = 100 × Δelevation_m / Δdistance_m`

Se calcula con una ventana centrada configurable. Se compararán al menos 250, 500 y 1.000 m; la selección dependerá de resolución, ruido y finalidad. El proyecto no considera 250 m universalmente suficiente.

## Trazabilidad mínima

Toda métrica conserva: sesión, intervalo, entradas, exclusiones, unidad, fórmula, versión de reglas y versión de software.
