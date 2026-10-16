@echo off
rem Doble clic: genera la version de produccion de Tankily y abre un tunel para verla desde fuera.
rem El enlace aparece en esta ventana. Para cerrarlo, cierra la ventana o pulsa Ctrl+C.
cd /d "%~dp0"
title Tankily - ver desde fuera
echo Generando la web (tarda un minuto)...
call npm run build
if errorlevel 1 (
  echo.
  echo No se ha podido generar la web. Revisa los errores de arriba.
  pause
  exit /b 1
)
call npm run fuera
pause
