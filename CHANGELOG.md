# Changelog

El formato sigue Keep a Changelog y el proyecto usa Semantic Versioning.

## [Unreleased]

## [0.3.0] - 2026-09-14

### Added

- Reconstrucción temporal con rejilla configurable, procedencia temporal y caducidad por señal.
- Segmentación automática de discontinuidades de adquisición superiores a 30 segundos.
- Cobertura efectiva por señal y métricas trazables por segmento.
- Validación de registros largos antes de calcular métricas.
- Informe web por segmento con distancia, gasolina, consumo y estado eléctrico.
- Pruebas sintéticas de discontinuidad, antigüedad, oscilación de acumuladores y valores imposibles.

### Changed

- Distancia y gasolina usan diferencias de acumuladores entre extremos y reconciliación independiente.
- El catálogo reconoce `Calculated instant fuel rate` y pasa a `0.3.0`.

### Fixed

- Impedida la suma de incrementos positivos en acumuladores oscilantes, que podía multiplicar artificialmente distancia y combustible.

## [0.2.0] - 2026-09-13

### Added

- Ingesta de registros largos Car Scanner sin pérdida de PIDs desconocidos.
- Catálogo Kia versionado con alias, unidades, procedencia y campo canónico.
- Inventario por sesión y puertas de capacidad para gasolina, HV, regeneración y GPS.
- Evidencia agregada y no geográfica de la línea base privada.
- Pruebas sintéticas para campos entrecomillados, filas inválidas y cobertura insuficiente.

## [0.1.0] - 2026-09-11

### Added

- Estructura profesional inicial del repositorio.
- Aplicación web con carga local de CSV Car Scanner.
- Modelo canónico, reglas de calidad y métricas energéticas básicas.
- Pendiente mediante ventana configurable y recomendador provisional.
- Documentación, ADR, fixtures sintéticos y quality gate.
