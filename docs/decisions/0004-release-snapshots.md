# ADR-0004: snapshots solo en hitos publicados

- Estado: aceptada
- Fecha: 2026-09-11

## Decisión

Git conserva cada cambio. `legacy/` almacenará únicamente snapshots documentales de releases relevantes, con manifiesto y justificación.

## Consecuencias

Se evita duplicar cada fichero después de cada edición y se conserva una referencia legible para hitos que necesiten auditoría externa.
