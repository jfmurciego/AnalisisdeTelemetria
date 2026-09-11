# ADR-0003: ventana de pendiente configurable

- Estado: aceptada
- Fecha: 2026-09-11

## Decisión

Calcular gradiente mediante ventanas configurables y registrar la ventana empleada. No fijar 250 m como resolución universal.

## Consecuencias

Ventanas cortas conservan cambios locales pero amplifican ruido; ventanas largas estabilizan la rasante pero desplazan transiciones. La validación comparará varias escalas.
