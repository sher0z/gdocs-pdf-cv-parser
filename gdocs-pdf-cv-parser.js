function cvParse() {

  var cvFolderName  = "cv";
  
  var folders;

//  var cvFolderOwner = "someone@sample.com"
//  var rootFolderId = DriveApp.getRootFolder().getId();
//  var rootFolderOwner = DriveApp.getRootFolder().getOwner().getEmail();
//  if (cvFolderOwner == rootFolderOwner)
//    folders = DriveApp.searchFolders('title = "'+cvFolderName+'" and "'+rootFolderId+'" in parents');
//  else
//    folders = DriveApp.searchFolders('title = "'+cvFolderName+'" and sharedWithMe');
  
  folders = DriveApp.searchFolders('title = "'+cvFolderName+'"');
  var folder = folders.hasNext() ? folders.next() : null;
  if (folder==null)
  {
    Browser.msgBox( cvFolderName + " folder not found!" );
    return;
  }
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Files");
  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();

  var cellValues = sheet.getRange(1, 1, lastRow, lastColumn).getValues();

  var colUrl = -1;
  var colKeywords = -1;
  var colId = -1;
  var colUploadDate = -1;
  var keywords = [];

  for (var col = 0; col < lastColumn; col++)
  {
    if(colUrl==-1 && cellValues[0][col]=='#url')
      colUrl = col;

    if(colKeywords==-1 && cellValues[0][col]=='#keywords')
      colKeywords = col;
    
    if(colId==-1 && cellValues[0][col]=='#id')
      colId = col;

    if(colUploadDate==-1 && cellValues[0][col]=='#upload-date')
      colUploadDate = col;

    if(colKeywords != -1 && col >= colKeywords)
      keywords.push(cellValues[1][col]);
  }
  
//  Browser.msgBox(colUrl+" : "+colName + " : " +colKeywords);
//  Browser.msgBox(_keywords);

  var countThisMonth = 0;
  var countLastMonth = 0;
  var countThisYear = 0;
  var countLastYear = 0;
  var countTotal = 0;
  
  var currentDate = new Date();
  var thisYear = currentDate.getFullYear();
  var thisMonth = currentDate.getMonth();
  var lastYear = thisYear-1;
  var lastMonth = thisMonth-1;
  var lastMonthYear = thisYear;

  if (lastMonth<0)
  {
      lastMonth=11;
      lastMonthYear = lastYear;
  }

  var cv_notes='';
  var cv_score='';
  var cv_id = '';
  var cv_upload_date = '';
  var cv_name='';
  var cv_url='';
  var cv_education='';
  var cv_experience='';
  var cv_awards='';
  var cv_gender='';
  var cv_int_exp='';
  var cv_languages='';

  var countProcessed = 0;
  var countTotal = 0;

  var files = folder.getFiles();
    
  while (files.hasNext()) {
    
    var file = files.next();
    var cv_url = file.getUrl();
    var cv_mimeType = file.getMimeType();
    
    // check if a file processed already
    var process = (cv_mimeType.search('pdf')!=-1);
    for (var row = 0; process && row < lastRow; row++)
      process = (cellValues[row][colUrl]!==cv_url);
    
    if (process)
    {
       cv_id = file.getId();
       cv_upload_date = file.getLastUpdated();

       var f_name = file.getName();

       var nameParts = f_name.split('-');
      
       cv_name = nameParts[0] + ' ' + nameParts[1];
       
       var text = '';
       var opts = {
         ocr: true
       };
       
       var resource = {
         title: f_name.replace(/pdf$/, 'gdoc'),
         mimeType: cv_mimeType
       };
       
       var blob = file.getBlob();
       var gdocFile = Drive.Files.insert(resource, blob, opts);
       //    Browser.msgBox(gdocFile.id);
       
       var gDoc = DocumentApp.openById(gdocFile.id);
       //    Browser.msgBox("opened ok");
       
       var body = gDoc.getBody();
       var text = body.getText();
       text = text.toLowerCase();
       
       //    Browser.msgBox(text);
       
       Drive.Files.remove(gdocFile.id);
       
       cells = [
         cv_notes,
         cv_name,
         cv_url,
         cv_id,
         cv_upload_date,
         cv_score,
         cv_education,
         cv_experience,
         cv_awards,
         cv_gender,
         cv_int_exp,
         cv_languages,
       ];
         
       for (var idx=0; idx<keywords.length; idx++)
         cells.push((text.search(keywords[idx])!=-1) ? 1 : 0);
       
       sheet.appendRow(cells);
      
       countProcessed++;
    }
       
    countTotal++;
  }

  Browser.msgBox( "Completed. Files Count (Processed / Total Found) : " + countProcessed+" / "+countTotal);
}

function cvSendToPortal()
{

  var apiUrl = "http://sample.com/api";

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Files");

  // send data to portal api
  var apiData = sheet.getRange(3,1,sheet.getLastRow(),5).getValues();
 
  var postOptions = {"method":"post",
                     "contentType" : "application/json",
                     "payload" : JSON.stringify(apiData)
                    };
  
  var response = UrlFetchApp.fetch(apiUrl, postOptions);
  
  Browser.msgBox( "Portal Response: "+response );  
}
