const API_BASE = '';


async function fetchItems() {
  try {
    const res = await fetch(`${API_BASE}/api/items`);
    const items = await res.json();
    const container = document.getElementById('items');
    if (items.length === 0) {
      container.innerHTML = '<p>No items yet. Add one above!</p>';
      return;
    }
    container.innerHTML = items.map(item => `
      <div class="item">
        <div><strong>${item.name}</strong> - ${item.description || 'No description'}</div>
        <button class="delete-btn" onclick="deleteItem(${item.id})">Delete</button>
      </div>
    `).join('');
  } catch (err) {
    document.getElementById('items').innerHTML = '<p>Error loading items</p>';
  }
}

async function addItem() {
  const name = document.getElementById('itemName').value;
  const description = document.getElementById('itemDesc').value;
  if (!name) return alert('Name is required');
  await fetch(`${API_BASE}/api/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description })
  });
  document.getElementById('itemName').value = '';
  document.getElementById('itemDesc').value = '';
  fetchItems();
}

async function deleteItem(id) {
  await fetch(`${API_BASE}/api/items/${id}`, { method: 'DELETE' });
  fetchItems();
}

async function fetchServerInfo() {
  try {
    const res = await fetch(`${API_BASE}/api/info`);
    const info = await res.json();
    document.getElementById('serverInfo').innerHTML = `
      <p>Instance: ${info.instance}</p>
      <p>Timestamp: ${info.timestamp}</p>
    `;
  } catch (err) {
    document.getElementById('serverInfo').innerHTML = '<p>Error fetching server info</p>';
  }
}

fetchItems();
fetchServerInfo();