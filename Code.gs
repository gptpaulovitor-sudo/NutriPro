/**
 * NutriAx Pro - Google Apps Script Backend (Code.gs)
 * SALVAR: Form POST (ContentService JSON)
 * LER/LISTAR: GET com ContentService JSON (fetch do localhost)
 *
 * Pasta alvo: https://drive.google.com/drive/u/5/folders/18I7NAPI1WTnwc59mG0_KIiKV7WzNADDi
 * IMPORTANTE: Sempre que alterar, reimplante como "Nova versão"!
 */

// ====================================================
// CONFIGURAÇÃO: ID da pasta no Google Drive
// ====================================================
var NUTRIAX_FOLDER_ID = "18I7NAPI1WTnwc59mG0_KIiKV7WzNADDi";

/**
 * Retorna o objeto Folder alvo. Lança erro se o ID estiver inválido.
 */
function _getFolder() {
  return DriveApp.getFolderById(NUTRIAX_FOLDER_ID);
}

function testDriveAuth() {
  var folder = _getFolder();
  var testFile = folder.createFile("NutriAx_Test_Auth.txt", "OK!", "text/plain");
  Logger.log("Permissão OK! Pasta: " + folder.getName() + " | Arquivo ID: " + testFile.getId());
  testFile.setTrashed(true);
}

function createTestMariaSilva() {
  var fileName = "NutriAx_Paciente_maria-silva.json";
  var testData = JSON.stringify({
    patientId: "maria-silva",
    patient: { id: "maria-silva", name: "Maria Silva Santos", gender: "Feminino", age: 32, height: 1.65, currentWeight: 64.5, objective: "Recomposição Corporal" },
    prescriptions: [],
    lastUpdated: new Date().toISOString()
  }, null, 2);

  _saveFile(fileName, testData);
  Logger.log("Arquivo de teste criado/atualizado: " + fileName);
}

// Helper: salva ou atualiza um arquivo NA PASTA CONFIGURADA
function _saveFile(fileName, content) {
  var folder = _getFolder();

  // Remove arquivo existente com o mesmo nome dentro da pasta
  var existing = folder.getFilesByName(fileName);
  while (existing.hasNext()) {
    existing.next().setTrashed(true);
  }

  // Cria o novo arquivo dentro da pasta alvo
  folder.createFile(fileName, content, "application/json");
}

// Helper: lê o conteúdo de texto de um arquivo
function _readFile(file) {
  return file.getBlob().getDataAsString();
}

// ====================================================
// POST: Salva os dados do paciente no Google Drive
// ====================================================
function doPost(e) {
  try {
    var jsonString = "";
    if (e && e.parameter && e.parameter.payload) {
      jsonString = e.parameter.payload;
    } else if (e && e.postData && e.postData.contents) {
      jsonString = e.postData.contents;
    } else {
      throw new Error("Sem dados.");
    }

    var requestData = JSON.parse(jsonString);
    var patientId = requestData.patientId ||
                    (requestData.patient && requestData.patient.id) ||
                    "paulo-vitor";
    var fileName = "NutriAx_Paciente_" + patientId + ".json";
    var payloadToSave = JSON.stringify(requestData, null, 2);

    _saveFile(fileName, payloadToSave);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", action: "save", patientId: patientId, fileName: fileName }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ====================================================
// GET: Carrega ou lista pacientes (responde com JSON)
// ====================================================
function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || "load";
    var patientId = (e && e.parameter && e.parameter.patientId) || "paulo-vitor";

    var responseObj = {};
    var folder = _getFolder();

    if (action === "list") {
      // Lista apenas os arquivos dentro da pasta configurada
      var filesList = folder.getFiles();
      var patientList = [];

      while (filesList.hasNext()) {
        var item = filesList.next();
        var name = item.getName();
        if (name.indexOf("NutriAx_Paciente_") === 0 && name.indexOf(".json") > -1) {
          var pId = name.replace("NutriAx_Paciente_", "").replace(".json", "");
          patientList.push({
            patientId: pId,
            fileName: name,
            lastUpdated: item.getLastUpdated().toISOString()
          });
        }
      }
      responseObj = { status: "success", action: "list", patients: patientList };

    } else {
      // action === "load" — busca o arquivo dentro da pasta configurada
      var fileName = "NutriAx_Paciente_" + patientId + ".json";
      var files = folder.getFilesByName(fileName);

      if (files.hasNext()) {
        var fileToRead = files.next();
        var contentText = _readFile(fileToRead);
        responseObj = {
          status: "success",
          action: "load",
          patientId: patientId,
          fileName: fileName,
          lastUpdated: fileToRead.getLastUpdated().toISOString(),
          data: JSON.parse(contentText)
        };
      } else {
        responseObj = {
          status: "not_found",
          action: "load",
          patientId: patientId,
          message: "Arquivo não encontrado: NutriAx_Paciente_" + patientId + ".json"
        };
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify(responseObj))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
