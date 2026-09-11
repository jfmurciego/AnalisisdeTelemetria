# Contribución

## Flujo

1. Abrir una issue con objetivo, evidencia y criterio de aceptación.
2. Crear una rama desde `main`: `feature/`, `fix/`, `docs/` o `chore/`.
3. Implementar código, pruebas, documentación y trazabilidad en el mismo cambio.
4. Ejecutar `pnpm verify`.
5. Abrir una PR y obtener revisión antes de fusionar.
6. Usar squash merge. El título de la PR debe seguir Conventional Commits.

## Versionado

- `MAJOR`: contrato o comportamiento incompatible.
- `MINOR`: capacidad compatible nueva.
- `PATCH`: corrección compatible.

Las fórmulas y reglas de calidad tienen versión propia para reproducir resultados históricos.

## Datos de prueba

Solo se admiten datos creados expresamente como sintéticos. No se anonimiza una ruta real para convertirla en fixture: se genera una ruta ficticia desde cero.
