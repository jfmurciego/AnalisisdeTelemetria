# ADR-0002: procedencia explícita y ausencia honesta

- Estado: aceptada
- Fecha: 2026-09-11

## Decisión

Clasificar señales como medidas, derivadas o externas. Un dato inválido permanece ausente y conserva un flag; no se sustituye por cero ni se interpola silenciosamente.

## Consecuencias

Los resultados pueden quedar como no calculables. Esa pérdida aparente de cobertura evita conclusiones falsas y mantiene auditabilidad.
