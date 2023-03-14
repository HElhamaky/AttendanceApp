// When scan is successful fucntion will produce data
let data = [];
let data2 = [];
let tableData = [];
let googleSheetData = [];

function onScanSuccess(qrCodeMessage) {
  //document.getElementById('result').innerHTML = '<span class="result">' + qrCodeMessage + '</span>';
  const str = qrCodeMessage;

  // Split string at comma character and create array
  const arr = str.split(',');
  const arrWithTime = str.split(',');
  const timestamp = Date.now();
  const date = new Date(timestamp);
  const formattedDate = date.toLocaleDateString();
  const options = {
    hour12: true,
    hour: 'numeric',
    minute: 'numeric',
  };
  const formattedTime = date.toLocaleTimeString('en-US', options);
  // const formattedTime = date.toLocaleTimeString();
  arrWithTime.push(`${formattedDate} ${formattedTime}`);
  data.push(arr.reverse());
  data2.push(arrWithTime);

  // Use a Set to store the unique JSON strings
  let uniqueArray = new Set(data.map(JSON.stringify));
  let uniqueArray2 = new Set(data2.map(JSON.stringify));

  // Convert the JSON strings back into arrays
  let result = Array.from(uniqueArray).map(JSON.parse);
  let result2 = Array.from(uniqueArray2).map(JSON.parse);
  const table = document.querySelector('.tableArea'); // replace #myDiv with the ID of your div
  table.style.display = 'block';
  const genBtn = document.querySelector('.excelGenArea'); // replace #myDiv with the ID of your div
  genBtn.style.display = 'flex';

  tableData = result.reverse();
  googleSheetData = result2;
  console.log(tableData);
  console.log(googleSheetData);

  var tableBody = document.getElementById('table-body');

  // Loop through the data array and build the table rows
  var tableRows = '';
  for (var i = 0; i < tableData.length; i++) {
    var rowData = '<tr>';
    for (var j = 0; j < tableData[i].length; j++) {
      rowData += '<td>' + tableData[i][j] + '</td>';
    }
    rowData += '</tr>';
    tableRows += rowData;
  }

  // Add the table rows to the table body
  tableBody.innerHTML = tableRows;
}

// When scan is unsuccessful fucntion will produce error message
function onScanError(errorMessage) {
  // Handle Scan Error
}

// Setting up Qr Scanner properties
var html5QrCodeScanner = new Html5QrcodeScanner('reader', {
  fps: 10,
  qrbox: 250,
});

// in
html5QrCodeScanner.render(onScanSuccess, onScanError);

// TODO(developer): Set to client ID and API key from the Developer Console
const CLIENT_ID = '612094786049-dkotspeqdsl50usn1af28ucr8ok402le.apps.googleusercontent.com';
const API_KEY = 'AIzaSyCN6osnZRi5pyzKossctv9s_tlfkz3ZU54';

// Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let tokenClient;
let gapiInited = false;
let gisInited = false;

document.getElementById('authorize_button').style.visibility = 'hidden';
document.getElementById('signout_button').style.visibility = 'hidden';

/**
 * Callback after api.js is loaded.
 */
function gapiLoaded() {
  gapi.load('client', initializeGapiClient);
}

/**
 * Callback after the API client is loaded. Loads the
 * discovery doc to initialize the API.
 */
async function initializeGapiClient() {
  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: [DISCOVERY_DOC],
  });
  gapiInited = true;
  maybeEnableButtons();
}

/**
 * Callback after Google Identity Services are loaded.
 */
function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: '', // defined later
  });
  gisInited = true;
  maybeEnableButtons();
}

/**
 * Enables user interaction after all libraries are loaded.
 */
function maybeEnableButtons() {
  if (gapiInited && gisInited) {
    document.getElementById('authorize_button').style.visibility = 'visible';
  }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick() {
  tokenClient.callback = async (resp) => {
    if (resp.error !== undefined) {
      throw resp;
    }
    document.getElementById('signout_button').style.visibility = 'visible';
    document.getElementById('authorize_button').innerText = 'Refresh';
    await createSheet();
  };

  if (gapi.client.getToken() === null) {
    // Prompt the user to select a Google Account and ask for consent to share their data
    // when establishing a new session.
    tokenClient.requestAccessToken({ prompt: 'consent' });
  } else {
    // Skip display of account chooser and consent dialog for an existing session.
    tokenClient.requestAccessToken({ prompt: '' });
  }
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick() {
  const token = gapi.client.getToken();
  if (token !== null) {
    google.accounts.oauth2.revoke(token.access_token);
    gapi.client.setToken('');
    document.getElementById('content').innerText = '';
    document.getElementById('authorize_button').innerText = 'Authorize';
    document.getElementById('signout_button').style.visibility = 'hidden';
  }
}

/**
 * Print the names and majors of students in a sample spreadsheet:
 * https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 */
async function listMajors() {
  let response;
  try {
    // Fetch first 10 files
    response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
      range: 'Class Data!A2:E',
    });
  } catch (err) {
    document.getElementById('content').innerText = err.message;
    return;
  }
  const range = response.result;
  if (!range || !range.values || range.values.length == 0) {
    document.getElementById('content').innerText = 'No values found.';
    return;
  }
  // Flatten to string to display
  const output = range.values.reduce((str, row) => `${str}${row[0]}, ${row[4]}\n`, 'Name, Major:\n');
  document.getElementById('content').innerText = output;
}

function createSheet() {
  // Create a new sheet
  gapi.client.sheets.spreadsheets
    .create({
      properties: {
        title: 'My Sheet',
      },
    })
    .then(
      function (response) {
        // Get the ID of the new sheet
        var sheetId = response.result.spreadsheetId;

        // Add headers to the sheet
        gapi.client.sheets.spreadsheets.values
          .update({
            spreadsheetId: sheetId,
            range: 'A1:C1',
            valueInputOption: 'USER_ENTERED',
            resource: {
              values: [['Name', 'Department', 'Timestamp']],
            },
          })
          .then(
            function (response) {
              // Write data to the sheet

              gapi.client.sheets.spreadsheets.values
                .append({
                  spreadsheetId: sheetId,
                  range: 'A2:C',
                  valueInputOption: 'USER_ENTERED',
                  resource: {
                    values: googleSheetData,
                  },
                })
                .then(
                  function (response) {
                    console.log('Sheet created and data added!');

                    // Open the created sheet in a new tab
                    var spreadsheetUrl = 'https://docs.google.com/spreadsheets/d/' + sheetId;
                    window.open(spreadsheetUrl, '_blank');
                  },
                  function (error) {
                    console.error(error.result.error.message);
                  }
                );
            },
            function (error) {
              console.error(error.result.error.message);
            }
          );
      },
      function (error) {
        console.error(error.result.error.message);
      }
    );
}

if (googleSheetData.length === 0) {
  const table = document.querySelector('.tableArea'); // replace #myDiv with the ID of your div
  const genBtn = document.querySelector('.excelGenArea'); // replace #myDiv with the ID of your div
  table.style.display = 'none'; // hide the div
  genBtn.style.display = 'none'; // hide the div
}
