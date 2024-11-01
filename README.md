# HouseUP Setup Guide

1. **serviceAccountKey.json**
   - stiahni z discordu
   - vloz do backend/
   - **!NIKDY NEUPLOADNUT NA GITHUB!**

2. **Update `frontend/service/api.js` (pri kazdej zmene IP adresy)**
   - `frontend/services/api.js`: nahrad localhost tvojou vlastnou IP address
       - windows: cmd -> ipconfig -> najdi si svoju ipv4 adresu
       - unix: terminal -> ip address -> same thing
       - vysledok bude vyzerat takto:  `baseURL: 'http://TVOJAIPADRESA:3000'`

3. **Backend Setup**
   - `cd backend`
   - `npm install`
   - `npm run dev`

4. **Frontend Setup**
   - `cd frontend`
   - `npm install`
   - `npm start` — alebo pri nejakom probleme ktory by nemal byt: `npx expo start -c` (vymaze cache)


___
Pozn.:<br/>
backend pouziva nodemon - pri uprave neni potreba vypinat a zapinat, restartuje sa sam pri ukladani zmien<br />
frontend pouziva expo - rovnako sa pri uprave sam vykresli novy render