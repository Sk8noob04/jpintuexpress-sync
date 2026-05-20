@echo off
title ngrok - JPintuexpress (WA Tunnel)
color 0B

set NGROK_EXE=C:\ngrok\ngrok.exe

echo ============================================================
echo   NGROK - TUNNEL PARA WHATSAPP SERVER
echo   Expone localhost:3001 a internet para que Vercel
echo   pueda enviar notificaciones WA desde produccion
echo ============================================================
echo.

if not exist "%NGROK_EXE%" (
    echo ERROR: ngrok no encontrado en C:\ngrok\ngrok.exe
    echo Ejecuta INSTALAR_Y_ARRANCAR_NGROK.bat primero.
    pause
    exit /b 1
)

echo Iniciando tunel en puerto 3001...
start "" /min cmd /k "%NGROK_EXE% http 3001"

echo Esperando que ngrok inicie...
timeout /t 4 /nobreak >nul

echo Obteniendo URL del tunel...
for /f "tokens=*" %%i in ('powershell -Command "(Invoke-RestMethod http://127.0.0.1:4040/api/tunnels).tunnels | Where-Object {$_.proto -eq 'https'} | Select-Object -ExpandProperty public_url"') do set NGROK_URL=%%i

if "%NGROK_URL%"=="" (
    echo ERROR: No se pudo obtener la URL de ngrok.
    echo Verifica que ngrok este corriendo en la otra ventana.
    pause
    exit /b 1
)

echo.
echo URL del tunel: %NGROK_URL%
echo.
echo Actualizando WA_SERVER_URL en Vercel...
cd /d "C:\Users\PC\Documents\Claude\Projects\Pagina de compras para jpintuexpress"

powershell -Command "& { $psi = New-Object System.Diagnostics.ProcessStartInfo; $psi.FileName = 'vercel'; $psi.Arguments = 'env rm WA_SERVER_URL production -y'; $psi.UseShellExecute = $false; $p = [System.Diagnostics.Process]::Start($psi); $p.WaitForExit() }" 2>nul

powershell -Command "& { $url = '%NGROK_URL%'; $psi = New-Object System.Diagnostics.ProcessStartInfo; $psi.FileName = 'vercel'; $psi.Arguments = 'env add WA_SERVER_URL production'; $psi.UseShellExecute = $false; $psi.RedirectStandardInput = $true; $p = [System.Diagnostics.Process]::Start($psi); $p.StandardInput.WriteLine($url); $p.StandardInput.Close(); $p.WaitForExit() }"

echo.
echo Haciendo redeploy para aplicar la nueva URL...
vercel --prod

echo.
echo ============================================================
echo   LISTO! Ngrok corriendo y Vercel actualizado.
echo   URL activa: %NGROK_URL%
echo   Deja la ventana de ngrok abierta mientras uses la app.
echo ============================================================
echo.
pause
