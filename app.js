import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD-4NQNzur3LEqK2e70BzFo85fg3BN-fbE",
  authDomain: "betlog-3c7f5.firebaseapp.com",
  projectId: "betlog-3c7f5",
  storageBucket: "betlog-3c7f5.appspot.com",
  messagingSenderId: "1021327577713",
  appId: "1:1021327577713:web:e6799de1089bec913301d0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const betsRef = collection(db, 'bets');

const form = document.getElementById('betForm');
const betHistory = document.getElementById('betHistory');
const searchBar = document.getElementById('searchBar');
const sortFilter = document.getElementById('sortFilter');
const typeFilter = document.getElementById('typeFilter');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = new FormData(form);

  const deposit = parseFloat(data.get('deposit'));
  const odds = parseFloat(data.get('odds'));
  const autoWonAmount = parseFloat((deposit * odds).toFixed(2));

  const bet = {
    team1: data.get('team1'),
    team2: data.get('team2'),
    odds,
    deposit,
    result: data.get('result'),
    type: data.get('type'),
    note: data.get('note'),
    wonAmount: autoWonAmount,
    timestamp: new Date().toISOString()
  };

  await addDoc(betsRef, bet);
  form.reset();
});

let allBets = [];

searchBar.addEventListener('input', renderBets);
sortFilter.addEventListener('change', renderBets);
typeFilter.addEventListener('change', renderBets);

onSnapshot(betsRef, (snapshot) => {
  allBets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderBets();
});

function renderBets() {
  const query = searchBar.value.toLowerCase();
  const sort = sortFilter.value;
  const type = typeFilter.value;

  let filtered = allBets.filter(bet =>
    (bet.team1.toLowerCase().includes(query) ||
     bet.team2.toLowerCase().includes(query) ||
     bet.odds.toString().includes(query)) &&
    (type === '' || bet.type === type)
  );

  if (sort === 'newest') {
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } else if (sort === 'oldest') {
    filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  betHistory.innerHTML = '';
  betHistory.style.display = 'flex';
  betHistory.style.overflowX = 'auto';
  betHistory.style.gap = '20px';

  filtered.forEach(bet => {
    const card = document.createElement('div');
    card.className = 'bet-card';
    card.style.maxWidth = '370px';
    card.style.minHeight = '350px';
    card.style.flex = '0 0 auto';

    const editSection = document.createElement('div');
    editSection.className = 'note-edit';

    const team1Input = document.createElement('input');
    team1Input.value = bet.team1;

    const team2Input = document.createElement('input');
    team2Input.value = bet.team2;

    const oddsInput = document.createElement('input');
    oddsInput.type = 'number';
    oddsInput.step = '0.01';
    oddsInput.value = bet.odds;

    const depositInput = document.createElement('input');
    depositInput.type = 'number';
    depositInput.step = '0.01';
    depositInput.value = bet.deposit;

    const expectedWin = parseFloat((bet.deposit * bet.odds).toFixed(2));
    const actualWin = bet.wonAmount ?? expectedWin;

    const wonInput = document.createElement('input');
    wonInput.type = 'number';
    wonInput.step = '0.01';
    wonInput.value = actualWin;
    wonInput.placeholder = 'Monto ganado';

    const wonLabel = document.createElement('div');
    if (actualWin !== expectedWin) {
      wonLabel.textContent = '*retirada';
      wonLabel.style.marginTop = '4px';
      wonLabel.style.color = '#ccc';
    }

    const resultSelect = document.createElement('select');
    resultSelect.innerHTML = `
      <option value="win">✅ Apuesta ganada</option>
      <option value="loss">❌ Apuesta perdida</option>
    `;
    resultSelect.value = bet.result;

    const typeSelect = document.createElement('select');
    typeSelect.innerHTML = `
      <option value="real">🔵 Real</option>
      <option value="simulated">🟠 Simulada</option>
    `;
    typeSelect.value = bet.type;

    const noteInput = document.createElement('textarea');
    noteInput.placeholder = 'Editar nota...';
    noteInput.value = bet.note;
    noteInput.style.resize = 'vertical';
    noteInput.style.minHeight = '60px';

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Guardar cambios';
    saveBtn.onclick = async () => {
      const updatedBet = {
        team1: team1Input.value,
        team2: team2Input.value,
        odds: parseFloat(oddsInput.value),
        deposit: parseFloat(depositInput.value),
        result: resultSelect.value,
        type: typeSelect.value,
        note: noteInput.value,
        wonAmount: parseFloat(wonInput.value)
      };
      await updateDoc(doc(db, 'bets', bet.id), updatedBet);
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Eliminar apuesta';
    deleteBtn.className = 'delete-btn';
    deleteBtn.onclick = async () => {
      if (confirm("¿Seguro que quieres eliminar esta apuesta?")) {
        await deleteDoc(doc(db, 'bets', bet.id));
      }
    };

    const buttonRow = document.createElement('div');
    buttonRow.className = 'button-row';
    buttonRow.style.display = 'flex';
    buttonRow.style.gap = '5px';
    buttonRow.appendChild(saveBtn);
    buttonRow.appendChild(deleteBtn);

    editSection.appendChild(team1Input);
    editSection.appendChild(team2Input);
    editSection.appendChild(oddsInput);
    editSection.appendChild(depositInput);
    editSection.appendChild(wonInput);
    editSection.appendChild(wonLabel);
    editSection.appendChild(resultSelect);
    editSection.appendChild(typeSelect);
    editSection.appendChild(noteInput);
    editSection.appendChild(buttonRow);

    card.appendChild(editSection);
    betHistory.appendChild(card);
  });
}
