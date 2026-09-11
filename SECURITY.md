# Seguridad y privacidad

## Datos prohibidos en Git

- CSV originales o limpios procedentes del coche.
- Coordenadas o rutas personales reales.
- Matrícula, VIN, direcciones, identificadores del adaptador o dispositivo.
- Claves API, tokens, cookies y credenciales.
- Exportaciones ZIP, GPX, FIT o TCX.

Los archivos reales se procesan localmente y permanecen fuera del árbol Git. Si un secreto o dato real llega a un commit, no basta con borrarlo en otro commit: debe revocarse cuando aplique y eliminarse del historial mediante un procedimiento aprobado.

## Límites de seguridad funcional

Los waypoints son ayuda anticipatoria. No controlan el vehículo, no sustituyen señales, límites, criterio del conductor ni sistemas de seguridad. Una recomendación sin cobertura suficiente se marca como `insufficient` y no se convierte en instrucción.
