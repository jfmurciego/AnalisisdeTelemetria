# ADR-0006: reconstrucción temporal explícita

- Estado: aceptada
- Fecha: 2026-09-14
- Versión: `0.3.0`

## Contexto

Car Scanner exporta una tabla larga. Cada fila contiene una observación de un PID y los PIDs se consultan de forma sucesiva. Dos valores próximos no son necesariamente simultáneos. Además, una sesión puede contener interrupciones de adquisición de decenas de minutos.

Agrupar filas mediante redondeo temporal oculta la antigüedad de cada señal y puede integrar energía o combustible a través de huecos sin evidencia.

## Decisión

1. La tabla larga permanece como fuente inmutable.
2. La línea temporal canónica usa una rejilla configurable de un segundo.
3. Cada valor alineado conserva `observedAtSecond` y `ageSeconds`.
4. Solo se usa la última observación anterior al instante de la rejilla. No se interpola.
5. El valor caduca a los dos segundos por defecto; SOC puede mantenerse cinco segundos.
6. Un hueco de adquisición superior a 30 segundos abre un nuevo segmento.
7. Ningún valor se arrastra entre segmentos.
8. Las integraciones excluyen intervalos superiores a tres segundos.
9. Los acumuladores se calculan por diferencia entre extremos del segmento. La suma de incrementos positivos queda prohibida porque amplifica oscilaciones de la aplicación.
10. Distancia y gasolina se contrastan con integraciones independientes de velocidad y caudal. Las divergencias degradan el resultado a provisional.

## Consecuencias

- Cada métrica declara entradas, fórmula, versión, cobertura y advertencias.
- Los huecos no se convierten en tiempo recorrido ni consumo cero.
- La electricidad queda bloqueada si voltaje y corriente no ofrecen al menos 80 % de cobertura simultánea.
- Un fichero puede producir varios segmentos y un segmento detenido puede tener distancia cero sin considerarse un error.
