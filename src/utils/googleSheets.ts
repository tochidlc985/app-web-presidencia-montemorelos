// Configuración para Google Sheets API
export interface GoogleSheetsConfig {
  spreadsheetId: string;
  range: string;
  apiKey: string;
}

export interface ReportDataForSheets {
  timestamp: string;
  id: string;
  email: string;
  telefono: string;
  departamento: string | string[];
  quienReporta: string;
  tipoProblema: string;
  prioridad: string;
  descripcion: string;
  imagenes: string | string[];
  status: string;
}

export class GoogleSheetsService {
  private readonly config: GoogleSheetsConfig;

  constructor() {
    this.config = {
      spreadsheetId: '1Cu8Brg7KWjxcCxmjfIdEGDeJ7aQlLxxwhiVlP9QqBvc',
      range: 'Hoja 1',
      apiKey: 'AIzaSyDUQKCj8uug24ZqWwiRHA97-hxQHnFzR5g'
    };
  }

  // Agrega una fila a la hoja de cálculo
  async appendRow(data: any[]): Promise<boolean> {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}/values/${encodeURIComponent(this.config.range)}:append?valueInputOption=USER_ENTERED&key=${this.config.apiKey}`;
      const requestBody = {
        values: [data],
        majorDimension: 'ROWS',
      };
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        console.error('Error al enviar a Google Sheets:', await response.text());
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error al enviar a Google Sheets:', error);
      return false;
    }
  }

  // Formatea los datos del reporte para Google Sheets
  formatearDatosReporte(reporte: Partial<ReportDataForSheets>): any[] {
    return [
      reporte.timestamp ? new Date(reporte.timestamp).toLocaleString('es-MX') : '', // timestamp
      reporte.id || '',
      reporte.email || '',
      reporte.telefono || '',
      Array.isArray(reporte.departamento)
        ? reporte.departamento.join(', ')
        : (reporte.departamento || ''),
      reporte.quienReporta || '',
      reporte.tipoProblema || '',
      reporte.prioridad || '',
      reporte.descripcion || '',
      Array.isArray(reporte.imagenes)
        ? reporte.imagenes.join(', ')
        : (reporte.imagenes || ''),
      reporte.status || ''
    ];
  }

  // Crea los encabezados en la hoja de cálculo
  async crearEncabezados(): Promise<boolean> {
    const encabezados = [
      'TIMESTAMP',
      'ID',
      'EMAIL',
      'TELEFONO',
      'DEPARTAMENTO',
      'QUIEN REPORTA',
      'TIPO DE PROBLEMA',
      'PRIORIDAD',
      'DESCRIPCION',
      'IMAGENES',
      'STATUS'
    ];
    return this.appendRow(encabezados);
  }

  // Obtiene los reportes desde Google Sheets
  async obtenerReportes(): Promise<ReportDataForSheets[]> {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}/values/${encodeURIComponent(this.config.range)}?key=${this.config.apiKey}`;
      const response = await fetch(url);
      if (!response.ok) {
        console.error('Error al obtener datos de Google Sheets:', await response.text());
        return [];
      }
      const data = await response.json();
      const rows = data.values || [];
      if (rows.length <= 1) return [];
      const headers = rows[0];
      return rows.slice(1).map((row: string[]) => {
        const obj: any = {};
        headers.forEach((header: string, idx: number) => {
          obj[header] = row[idx] || '';
        });
        // Convierte campos separados por coma a array si aplica
        if (typeof obj['DEPARTAMENTO'] === 'string') {
          obj['DEPARTAMENTO'] = obj['DEPARTAMENTO'].split(',').map((d: string) => d.trim()).filter(Boolean);
        }
        if (typeof obj['IMAGENES'] === 'string') {
          obj['IMAGENES'] = obj['IMAGENES'].split(',').map((d: string) => d.trim()).filter(Boolean);
        }
        return obj as ReportDataForSheets;
      });
    } catch (error) {
      console.error('Error al obtener datos de Google Sheets:', error);
      return [];
    }
  }
}

export const googleSheets = new GoogleSheetsService();