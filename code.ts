figma.showUI(__html__);

figma.ui.onmessage = async (msg) => {
  if (msg.type === "createFrames") {
    try {
      const sheetUrl = msg.sheetUrl;

      console.time("googleSheetsProxy"); // Начало замера времени

      // Получаем данные из Google Sheets по ссылке
      const sheetData = await getSheetData(sheetUrl);

      // Завершение замера времени
      console.timeEnd("googleSheetsProxy");

      // Создаем фреймы на основе данных из таблицы
      createFrames(sheetData);

      figma.closePlugin();
    } catch (error) {
      console.error("Error:", error.message); // Выводим сообщение об ошибке
      figma.closePlugin();
    }
  }
};

async function getSheetData(sheetUrl: string): Promise<any[]> {
  try {
    console.time("fetchData"); // Начало замера времени

    // Извлекаем идентификатор таблицы из URL
    const spreadsheetIdMatch = sheetUrl.match(/[-\w]{25,}/);
    if (!spreadsheetIdMatch) {
      throw new Error("Invalid Google Sheets URL");
    }
    const spreadsheetId = spreadsheetIdMatch[0];

    // Запрашиваем данные из таблицы
    const response = await fetch(
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json`
    );

    // Проверяем, получен ли ответ с кодом 200
    if (!response.ok) {
      throw new Error(
        `Failed to fetch Google Sheets data. HTTP status ${response.status}`
      );
    }

    const data = await response.text();
    const jsonData = JSON.parse(data.replace("/*O_o*/", ""));

    // Преобразуем данные в нужный формат
    const sheetData = jsonData.table.rows.map((row: any) => {
      const entry: any = {};
      row.c.forEach((cell: any, index: number) => {
        const columnName = jsonData.table.cols[index].label;
        entry[columnName] = cell.v;
      });
      return entry;
    });

    // Завершение замера времени
    console.timeEnd("fetchData");

    return sheetData;
  } catch (error) {
    console.error("Error fetching Google Sheets data:", error.message);
    throw new Error("Failed to fetch Google Sheets data");
  }
}

function createFrames(data: any[]): void {
  // Создаем фреймы в Figma на основе данных из таблицы
  for (const entry of data) {
    const frame = figma.createFrame();
    frame.resize(entry.w, entry.h);
    frame.name = entry.nam
