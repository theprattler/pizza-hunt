// create variable to hold db connection
let db;

// establish a connection to IndexedDB database called 'pizza_hunt' and set it to Version 1
const request = indexedDB.open('pizza_hunt', 1);

// this event will emit if the database version changes (nonexistant to Version 1, V1 to V2, etc)
request.onupgradeneeded = function(event) {
  // save a locally scoped reference to the database
  const db = event.target.result;
  // create an Object Store (table) called `new_pizza`, set it to have an auto-incrementing primary key of sorts
  db.createObjectStore('new_pizza', { autoIncrement: true });
}; 

// upon success
request.onsuccess = function(event) {
  // when db is successfully created with its Object Store (from onupdradeneeded event above) or simply established a connection, save reference to db in global variable
  db = event.target.result;
  // check if app is online; if yes run uploadPizza() to send all local db data to api
  if (navigator.onLine) {
    uploadPizza();
  }
};

request.onerror = function(event) {
  console.log(event.target.errorCode);
};

// saveRecord() will be executed if we attempt to submit a new pizza and there is no internet connection
function saveRecord(record) {
  // open a new transaction with the database with read and write permissions
  const transaction = db.transaction(['new_pizza'], 'readwrite');
  // access the Object Store for `new_pizza`
  const pizzaObjectStore = transaction.objectStore('new_pizza');
  // add record to your store with add method
  pizzaObjectStore.add(record);
};

function uploadPizza() {
  // open a transaction on your db
  const transaction = db.transaction(['new_pizza'], 'readwrite');
  // access the Object Store
  const pizzaObjectStore = transaction.objectStore('new_pizza');
  // get all records from store and set to a variable
  const getAll = pizzaObjectStore.getAll();
  // upon successful .getAll(), run getAll.onsuccess
  getAll.onsuccess = function() {
    // if any data in indexedDb's store, send it to api server
    if (getAll.result.length > 0) {
      fetch('/api/pizzas', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
      .then(response => response.json())
      .then(serverResponse => {
        if (serverResponse.message) {
          throw new Error(serverResponse);
        }
        // open one more transaction
        const transaction = db.transaction(['new_pizza'], 'readwrite');
        // access the new_pizza Object Store
        const pizzaObjectStore = transaction.objectStore('new_pizza');
        // clear all items in store
        pizzaObjectStore.clear();

        alert('All saved pizza has been submitted');
      })
      .catch(err => {
        console.log(err);
      });
    }
  };
};

// listen for app coming back online
window.addEventListener('online', uploadPizza);