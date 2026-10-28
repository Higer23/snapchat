# snapchat

A static web app backed by Firebase Realtime Database, plus GitHub Actions automation that keeps the repository active and updates a EUR/TRY rate file.

## English

**Web app:** index.html, app.js and style.css implement the front end. app.js reads and writes a Firebase Realtime Database (project snapchat-pro-tombola).

**Automation (.github/workflows)**
- euro-rate-tracker.yml: every 6 hours, fetches the EUR to TRY rate from the Frankfurter API and updates euro.txt.
- streak-keeper.yml: runs three times a day and can create a heartbeat commit so the contribution streak is kept.
- hourly-streak-report.yml and external-heartbeat.yml: supporting checks for the same heartbeat.

**Security note:** The Firebase configuration is committed in app.js. Firebase web keys are public by design, so protect the data with Realtime Database security rules.

**Run locally:** open index.html in a browser, or serve the folder with python -m http.server.

## Deutsch

**Webanwendung:** index.html, app.js und style.css bilden das Frontend. app.js liest und schreibt in eine Firebase Realtime Database (Projekt snapchat-pro-tombola).

**Automatisierung (.github/workflows)**
- euro-rate-tracker.yml: alle 6 Stunden wird der EUR-zu-TRY-Kurs ueber die Frankfurter-API abgerufen und euro.txt aktualisiert.
- streak-keeper.yml: laeuft dreimal taeglich und kann einen Heartbeat-Commit erstellen, damit die Beitragsserie erhalten bleibt.
- hourly-streak-report.yml und external-heartbeat.yml: ergaenzende Pruefungen fuer denselben Heartbeat.

**Sicherheitshinweis:** Die Firebase-Konfiguration ist in app.js hinterlegt. Firebase-Web-Schluessel sind oeffentlich vorgesehen; schuetzen Sie den Datenzugriff daher ueber die Sicherheitsregeln der Realtime Database.

**Lokal starten:** index.html im Browser oeffnen oder den Ordner mit python -m http.server bereitstellen.

## Türkçe

**Web uygulaması:** index.html, app.js ve style.css ön yüzü oluşturur. app.js, bir Firebase Realtime Database'den (proje snapchat-pro-tombola) okuyup yazar.

**Otomasyon (.github/workflows)**
- euro-rate-tracker.yml: 6 saatte bir Frankfurter API'den EUR/TRY kurunu alır ve euro.txt dosyasını günceller.
- streak-keeper.yml: günde üç kez çalışır ve katkı serisini korumak için gerektiğinde bir heartbeat commit'i oluşturabilir.
- hourly-streak-report.yml ve external-heartbeat.yml: aynı heartbeat için destekleyici kontroller.

**Güvenlik notu:** Firebase yapılandırması app.js içinde yer alıyor. Firebase web anahtarları tasarım gereği herkese açıktır; bu yüzden verileri Realtime Database güvenlik kurallarıyla koruyun.

**Yerelde çalıştırma:** index.html dosyasını tarayıcıda açın ya da klasörü python -m http.server ile sunun.
