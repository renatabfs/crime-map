import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

export type MetricUnit = 'victims' | 'occurrences' | 'kg';

export type ComparisonMethod =
  | 'population_per_100k'
  | 'alternative_denominator_recommended'
  | 'absolute_only';

export type GeographicGranularity = 'state_and_municipality' | 'state_only';

export interface IndicatorCatalogEntry {
  id: string;
  rawEventName: string;
  label: string;
  category:
    | 'letal-violento'
    | 'dignidade-sexual'
    | 'patrimonio'
    | 'drogas-armas-produtividade'
    | 'desaparecidos-localizados'
    | 'transito-outros';
  unit: MetricUnit;
  unitLabel: string;
  scope: 'Estadual';
  granularity: GeographicGranularity;
  comparisonMethod: ComparisonMethod;
  comparisonNote: string;
}

export interface StatePopulationEntry {
  year: 2025;
  ibgeCode: string;
  uf: string;
  stateName: string;
  population: number;
  referenceDate: '2025-07-01';
  source: 'IBGE - Estimativas da População Residente (Tabela 6579, Variável 9324)';
  apiUrl: string;
}

export interface StateCrimeIndicatorEntry {
  year: 2025;
  uf: string;
  stateName: string;
  indicatorId: string;
  rawEventName: string;
  label: string;
  category: IndicatorCatalogEntry['category'];
  scope: 'Estadual';
  granularity: GeographicGranularity;
  unit: MetricUnit;
  unitLabel: string;
  comparisonMethod: ComparisonMethod;
  value: number | null;
  sexBreakdown: {
    feminino: number | null;
    masculino: number | null;
    naoInformado: number | null;
  } | null;
  population: number;
  ratePer100k: number | null;
  source: 'MJSP / Sinesp VDE (BancoVDE 2025.xlsx)';
}

const IBGE_POP_API_URL =
  'https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos/2025/variaveis/9324?localidades=N3[all]';

const EXPECTED_NATIONAL_POPULATION_2025 = 213_421_037;

const IBGE_UF_BY_CODE: Record<string, { uf: string; name: string }> = {
  '11': { uf: 'RO', name: 'Rondônia' },
  '12': { uf: 'AC', name: 'Acre' },
  '13': { uf: 'AM', name: 'Amazonas' },
  '14': { uf: 'RR', name: 'Roraima' },
  '15': { uf: 'PA', name: 'Pará' },
  '16': { uf: 'AP', name: 'Amapá' },
  '17': { uf: 'TO', name: 'Tocantins' },
  '21': { uf: 'MA', name: 'Maranhão' },
  '22': { uf: 'PI', name: 'Piauí' },
  '23': { uf: 'CE', name: 'Ceará' },
  '24': { uf: 'RN', name: 'Rio Grande do Norte' },
  '25': { uf: 'PB', name: 'Paraíba' },
  '26': { uf: 'PE', name: 'Pernambuco' },
  '27': { uf: 'AL', name: 'Alagoas' },
  '28': { uf: 'SE', name: 'Sergipe' },
  '29': { uf: 'BA', name: 'Bahia' },
  '31': { uf: 'MG', name: 'Minas Gerais' },
  '32': { uf: 'ES', name: 'Espírito Santo' },
  '33': { uf: 'RJ', name: 'Rio de Janeiro' },
  '35': { uf: 'SP', name: 'São Paulo' },
  '41': { uf: 'PR', name: 'Paraná' },
  '42': { uf: 'SC', name: 'Santa Catarina' },
  '43': { uf: 'RS', name: 'Rio Grande do Sul' },
  '50': { uf: 'MS', name: 'Mato Grosso do Sul' },
  '51': { uf: 'MT', name: 'Mato Grosso' },
  '52': { uf: 'GO', name: 'Goiás' },
  '53': { uf: 'DF', name: 'Distrito Federal' },
};

const INDICATOR_CATALOG: IndicatorCatalogEntry[] = [
  {
    id: 'homicidio-doloso',
    rawEventName: 'Homicídio doloso',
    label: 'Homicídio doloso',
    category: 'letal-violento',
    unit: 'victims',
    unitLabel: 'vítimas',
    scope: 'Estadual',
    granularity: 'state_and_municipality',
    comparisonMethod: 'population_per_100k',
    comparisonNote: 'Comparável entre UFs pela taxa de vítimas por 100 mil habitantes.',
  },
  {
    id: 'feminicidio',
    rawEventName: 'Feminicídio',
    label: 'Feminicídio',
    category: 'letal-violento',
    unit: 'victims',
    unitLabel: 'vítimas',
    scope: 'Estadual',
    granularity: 'state_and_municipality',
    comparisonMethod: 'population_per_100k',
    comparisonNote:
      'Taxa calculada sobre a população residente total (100 mil hab.), conforme padrão do Mapa da Segurança Pública do MJSP.',
  },
  {
    id: 'latrocinio',
    rawEventName: 'Roubo seguido de morte (latrocínio)',
    label: 'Roubo seguido de morte (latrocínio)',
    category: 'letal-violento',
    unit: 'victims',
    unitLabel: 'vítimas',
    scope: 'Estadual',
    granularity: 'state_and_municipality',
    comparisonMethod: 'population_per_100k',
    comparisonNote: 'Comparável entre UFs pela taxa de vítimas por 100 mil habitantes.',
  },
  {
    id: 'lesao-corporal-seguida-de-morte',
    rawEventName: 'Lesão corporal seguida de morte',
    label: 'Lesão corporal seguida de morte',
    category: 'letal-violento',
    unit: 'victims',
    unitLabel: 'vítimas',
    scope: 'Estadual',
    granularity: 'state_and_municipality',
    comparisonMethod: 'population_per_100k',
    comparisonNote: 'Comparável entre UFs pela taxa de vítimas por 100 mil habitantes.',
  },
  {
    id: 'tentativa-de-homicidio',
    rawEventName: 'Tentativa de homicídio',
    label: 'Tentativa de homicídio',
    category: 'letal-violento',
    unit: 'victims',
    unitLabel: 'vítimas',
    scope: 'Estadual',
    granularity: 'state_and_municipality',
    comparisonMethod: 'population_per_100k',
    comparisonNote: 'Comparável entre UFs pela taxa de vítimas por 100 mil habitantes.',
  },
  {
    id: 'tentativa-de-feminicidio',
    rawEventName: 'Tentativa de feminicídio',
    label: 'Tentativa de feminicídio',
    category: 'letal-violento',
    unit: 'victims',
    unitLabel: 'vítimas',
    scope: 'Estadual',
    granularity: 'state_and_municipality',
    comparisonMethod: 'population_per_100k',
    comparisonNote: 'Comparável entre UFs pela taxa de vítimas por 100 mil habitantes.',
  },
  {
    id: 'morte-intervencao-agente-estado',
    rawEventName: 'Morte por intervenção de Agente do Estado',
    label: 'Morte por intervenção de agente do Estado',
    category: 'letal-violento',
    unit: 'victims',
    unitLabel: 'vítimas',
    scope: 'Estadual',
    granularity: 'state_only',
    comparisonMethod: 'population_per_100k',
    comparisonNote: 'Comparável entre UFs pela taxa de vítimas por 100 mil habitantes.',
  },
  {
    id: 'morte-agente-estado',
    rawEventName: 'Morte de Agente do Estado',
    label: 'Morte de agente do Estado',
    category: 'letal-violento',
    unit: 'victims',
    unitLabel: 'vítimas',
    scope: 'Estadual',
    granularity: 'state_only',
    comparisonMethod: 'absolute_only',
    comparisonNote:
      'Mantido em valor absoluto (o denominador adequado seria o efetivo policial ativo por UF, não a população geral).',
  },
  {
    id: 'estupro',
    rawEventName: 'Estupro',
    label: 'Estupro',
    category: 'dignidade-sexual',
    unit: 'victims',
    unitLabel: 'vítimas',
    scope: 'Estadual',
    granularity: 'state_only',
    comparisonMethod: 'population_per_100k',
    comparisonNote: 'Comparável entre UFs pela taxa de vítimas por 100 mil habitantes.',
  },
  {
    id: 'estupro-de-vulneravel',
    rawEventName: 'Estupro de vulnerável',
    label: 'Estupro de vulnerável',
    category: 'dignidade-sexual',
    unit: 'victims',
    unitLabel: 'vítimas',
    scope: 'Estadual',
    granularity: 'state_only',
    comparisonMethod: 'population_per_100k',
    comparisonNote: 'Comparável entre UFs pela taxa de vítimas por 100 mil habitantes.',
  },
  {
    id: 'roubo-de-veiculo',
    rawEventName: 'Roubo de veículo',
    label: 'Roubo de veículo',
    category: 'patrimonio',
    unit: 'occurrences',
    unitLabel: 'ocorrências',
    scope: 'Estadual',
    granularity: 'state_only',
    comparisonMethod: 'population_per_100k',
    comparisonNote:
      'Taxa por 100 mil habitantes (padrão MJSP; idealmente complementada pela frota estadual registrada no Senatran).',
  },
  {
    id: 'furto-de-veiculo',
    rawEventName: 'Furto de veículo',
    label: 'Furto de veículo',
    category: 'patrimonio',
    unit: 'occurrences',
    unitLabel: 'ocorrências',
    scope: 'Estadual',
    granularity: 'state_only',
    comparisonMethod: 'population_per_100k',
    comparisonNote:
      'Taxa por 100 mil habitantes (padrão MJSP; idealmente complementada pela frota estadual registrada no Senatran).',
  },
  {
    id: 'roubo-de-carga',
    rawEventName: 'Roubo de carga',
    label: 'Roubo de carga',
    category: 'patrimonio',
    unit: 'occurrences',
    unitLabel: 'ocorrências',
    scope: 'Estadual',
    granularity: 'state_only',
    comparisonMethod: 'population_per_100k',
    comparisonNote: 'Taxa de ocorrências por 100 mil habitantes (padrão MJSP).',
  },
  {
    id: 'roubo-instituicao-financeira',
    rawEventName: 'Roubo a instituição financeira',
    label: 'Roubo a instituição financeira',
    category: 'patrimonio',
    unit: 'occurrences',
    unitLabel: 'ocorrências',
    scope: 'Estadual',
    granularity: 'state_only',
    comparisonMethod: 'absolute_only',
    comparisonNote:
      'Mantido em valor absoluto devido à baixa frequência anual e dependência da rede de agências/terminais bancários.',
  },
  {
    id: 'trafico-de-drogas',
    rawEventName: 'Tráfico de drogas',
    label: 'Tráfico de drogas (registros)',
    category: 'drogas-armas-produtividade',
    unit: 'occurrences',
    unitLabel: 'ocorrências',
    scope: 'Estadual',
    granularity: 'state_only',
    comparisonMethod: 'absolute_only',
    comparisonNote:
      'Mantido em valor absoluto: reflete majoritariamente produtividade e flagrantes policiais, não incidência demográfica.',
  },
  {
    id: 'apreensao-cocaina',
    rawEventName: 'Apreensão de Cocaína',
    label: 'Apreensão de cocaína',
    category: 'drogas-armas-produtividade',
    unit: 'kg',
    unitLabel: 'kg',
    scope: 'Estadual',
    granularity: 'state_only',
    comparisonMethod: 'absolute_only',
    comparisonNote:
      'Medido em quilogramas (kg). Não se aplica taxa por 100 mil habitantes. MG e RJ possuem dado indisponível (null) em 2025.',
  },
  {
    id: 'apreensao-maconha',
    rawEventName: 'Apreensão de Maconha',
    label: 'Apreensão de maconha',
    category: 'drogas-armas-produtividade',
    unit: 'kg',
    unitLabel: 'kg',
    scope: 'Estadual',
    granularity: 'state_only',
    comparisonMethod: 'absolute_only',
    comparisonNote:
      'Medido em quilogramas (kg). Não se aplica taxa por 100 mil habitantes. MG e RJ possuem dado indisponível (null) em 2025.',
  },
  {
    id: 'arma-de-fogo-apreendida',
    rawEventName: 'Arma de Fogo Apreendida',
    label: 'Arma de fogo apreendida',
    category: 'drogas-armas-produtividade',
    unit: 'occurrences',
    unitLabel: 'armas',
    scope: 'Estadual',
    granularity: 'state_only',
    comparisonMethod: 'absolute_only',
    comparisonNote:
      'Mantido em valor absoluto (soma de todas as categorias de armas): indicador de produtividade e apreensão policial.',
  },
  {
    id: 'mandado-prisao-cumprido',
    rawEventName: 'Mandado de prisão cumprido',
    label: 'Mandado de prisão cumprido',
    category: 'drogas-armas-produtividade',
    unit: 'occurrences',
    unitLabel: 'mandados',
    scope: 'Estadual',
    granularity: 'state_and_municipality',
    comparisonMethod: 'absolute_only',
    comparisonNote:
      'Mantido em valor absoluto: indicador operacional de cumprimento judicial (não comparável por população residente).',
  },
  {
    id: 'pessoa-desaparecida',
    rawEventName: 'Pessoa Desaparecida',
    label: 'Pessoa desaparecida',
    category: 'desaparecidos-localizados',
    unit: 'victims',
    unitLabel: 'pessoas',
    scope: 'Estadual',
    granularity: 'state_only',
    comparisonMethod: 'population_per_100k',
    comparisonNote: 'Comparável entre UFs pela taxa de pessoas desaparecidas por 100 mil habitantes.',
  },
  {
    id: 'pessoa-localizada',
    rawEventName: 'Pessoa Localizada',
    label: 'Pessoa localizada',
    category: 'desaparecidos-localizados',
    unit: 'victims',
    unitLabel: 'pessoas',
    scope: 'Estadual',
    granularity: 'state_only',
    comparisonMethod: 'population_per_100k',
    comparisonNote: 'Comparável entre UFs pela taxa de pessoas localizadas por 100 mil habitantes.',
  },
  {
    id: 'morte-transito',
    rawEventName: 'Morte no trânsito ou em decorrência dele (exceto homicídio doloso)',
    label: 'Morte no trânsito (exceto homicídio doloso)',
    category: 'transito-outros',
    unit: 'victims',
    unitLabel: 'vítimas',
    scope: 'Estadual',
    granularity: 'state_and_municipality',
    comparisonMethod: 'population_per_100k',
    comparisonNote: 'Comparável entre UFs pela taxa de vítimas por 100 mil habitantes.',
  },
  {
    id: 'mortes-a-esclarecer',
    rawEventName: 'Mortes a esclarecer (sem indício de crime)',
    label: 'Mortes a esclarecer (sem indício de crime)',
    category: 'transito-outros',
    unit: 'victims',
    unitLabel: 'vítimas',
    scope: 'Estadual',
    granularity: 'state_and_municipality',
    comparisonMethod: 'population_per_100k',
    comparisonNote: 'Comparável entre UFs pela taxa de registros por 100 mil habitantes.',
  },
  {
    id: 'suicidio',
    rawEventName: 'Suicídio',
    label: 'Suicídio',
    category: 'transito-outros',
    unit: 'victims',
    unitLabel: 'vítimas',
    scope: 'Estadual',
    granularity: 'state_and_municipality',
    comparisonMethod: 'population_per_100k',
    comparisonNote: 'Comparável entre UFs pela taxa de vítimas por 100 mil habitantes.',
  },
];

async function fetchAndValidateIbgePopulation2025(): Promise<StatePopulationEntry[]> {
  console.log('1/4 Consultando API oficial do SIDRA/IBGE (Tabela 6579, Variável 9324, 2025)...');
  const response = await fetch(IBGE_POP_API_URL);
  if (!response.ok) {
    throw new Error(`Falha ao consultar API do IBGE: HTTP ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as Array<{
    id: string;
    variavel: string;
    resultados: Array<{
      series: Array<{
        localidade: { id: string; nome: string };
        serie: Record<string, string>;
      }>;
    }>;
  }>;

  const series = payload?.[0]?.resultados?.[0]?.series;
  if (!Array.isArray(series) || series.length === 0) {
    throw new Error('Estrutura inesperada na resposta da API do IBGE: séries vazias.');
  }

  const seenUfs = new Set<string>();
  const seenCodes = new Set<string>();
  const entries: StatePopulationEntry[] = [];

  for (const item of series) {
    const code = String(item.localidade.id).trim();
    const ufMeta = IBGE_UF_BY_CODE[code];
    if (!ufMeta) {
      throw new Error(`Código territorial IBGE desconhecido retornado pela API: "${code}"`);
    }

    const rawPop = item.serie?.['2025'];
    if (!rawPop || !/^\d+$/.test(rawPop.trim())) {
      throw new Error(`Valor populacional ausente ou inválido para ${ufMeta.uf} (${code}): "${rawPop}"`);
    }

    const population = Number.parseInt(rawPop.trim(), 10);
    if (!Number.isFinite(population) || population <= 0) {
      throw new Error(`População inválida (<= 0) para ${ufMeta.uf}: ${population}`);
    }

    if (seenUfs.has(ufMeta.uf) || seenCodes.has(code)) {
      throw new Error(`Duplicidade detectada nos dados do IBGE para UF ${ufMeta.uf} (${code})`);
    }

    seenUfs.add(ufMeta.uf);
    seenCodes.add(code);

    entries.push({
      year: 2025,
      ibgeCode: code,
      uf: ufMeta.uf,
      stateName: ufMeta.name,
      population,
      referenceDate: '2025-07-01',
      source: 'IBGE - Estimativas da População Residente (Tabela 6579, Variável 9324)',
      apiUrl: IBGE_POP_API_URL,
    });
  }

  if (entries.length !== 27) {
    throw new Error(`Validação falhou: esperado 27 UFs do IBGE, obtido ${entries.length}.`);
  }

  const totalBrazil = entries.reduce((acc, row) => acc + row.population, 0);
  if (totalBrazil !== EXPECTED_NATIONAL_POPULATION_2025) {
    throw new Error(
      `Validação falhou: soma nacional (${totalBrazil}) diverge do total oficial DOU 2025 (${EXPECTED_NATIONAL_POPULATION_2025}).`
    );
  }

  entries.sort((a, b) => a.uf.localeCompare(b.uf));
  console.log(
    `    OK: 27 UFs validadas sem duplicidades/nulos. Soma nacional = ${totalBrazil.toLocaleString('pt-BR')} hab.`
  );
  return entries;
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)));
}

function columnLettersToIndex(letters: string): number {
  let idx = 0;
  for (let i = 0; i < letters.length; i++) {
    idx = idx * 26 + (letters.charCodeAt(i) - 64);
  }
  return idx - 1;
}

interface ZipEntryInfo {
  fileName: string;
  compressionMethod: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
}

function readZipCentralDirectory(zipBuffer: Buffer): Map<string, ZipEntryInfo> {
  let eocdOffset = -1;
  for (let i = zipBuffer.length - 22; i >= Math.max(0, zipBuffer.length - 65557); i--) {
    if (zipBuffer.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) {
    throw new Error('Arquivo XLSX inválido: assinatura EOCD ZIP não encontrada.');
  }

  const totalEntries = zipBuffer.readUInt16LE(eocdOffset + 10);
  const centralDirOffset = zipBuffer.readUInt32LE(eocdOffset + 16);

  const entries = new Map<string, ZipEntryInfo>();
  let ptr = centralDirOffset;

  for (let i = 0; i < totalEntries; i++) {
    if (zipBuffer.readUInt32LE(ptr) !== 0x02014b50) {
      throw new Error('Cabeçalho de diretório central ZIP corrompido no XLSX.');
    }
    const compressionMethod = zipBuffer.readUInt16LE(ptr + 10);
    const compressedSize = zipBuffer.readUInt32LE(ptr + 20);
    const uncompressedSize = zipBuffer.readUInt32LE(ptr + 24);
    const fileNameLen = zipBuffer.readUInt16LE(ptr + 28);
    const extraFieldLen = zipBuffer.readUInt16LE(ptr + 30);
    const commentLen = zipBuffer.readUInt16LE(ptr + 32);
    const localHeaderOffset = zipBuffer.readUInt32LE(ptr + 42);
    const fileName = zipBuffer.subarray(ptr + 46, ptr + 46 + fileNameLen).toString('utf8');

    entries.set(fileName, {
      fileName,
      compressionMethod,
      compressedSize,
      uncompressedSize,
      localHeaderOffset,
    });

    ptr += 46 + fileNameLen + extraFieldLen + commentLen;
  }

  return entries;
}

function extractZipEntryBuffer(zipBuffer: Buffer, entry: ZipEntryInfo): Buffer {
  const lh = entry.localHeaderOffset;
  if (zipBuffer.readUInt32LE(lh) !== 0x04034b50) {
    throw new Error(`Cabeçalho local ZIP inválido para ${entry.fileName}`);
  }
  const fileNameLen = zipBuffer.readUInt16LE(lh + 26);
  const extraFieldLen = zipBuffer.readUInt16LE(lh + 28);
  const dataStart = lh + 30 + fileNameLen + extraFieldLen;
  const compressedSlice = zipBuffer.subarray(dataStart, dataStart + entry.compressedSize);

  if (entry.compressionMethod === 0) {
    return compressedSlice;
  }
  if (entry.compressionMethod === 8) {
    return zlib.inflateRawSync(compressedSlice);
  }
  throw new Error(`Método de compressão ZIP não suportado: ${entry.compressionMethod}`);
}

function parseSharedStrings(xmlText: string): string[] {
  const strings: string[] = [];
  const siRegex = /<si>([\s\S]*?)<\/si>/g;
  const tRegex = /<t(?:\s+[^>]*)?>([\s\S]*?)<\/t>/g;
  let siMatch: RegExpExecArray | null;

  while ((siMatch = siRegex.exec(xmlText)) !== null) {
    const inner = siMatch[1];
    let combined = '';
    let tMatch: RegExpExecArray | null;
    tRegex.lastIndex = 0;
    while ((tMatch = tRegex.exec(inner)) !== null) {
      combined += decodeXmlEntities(tMatch[1]);
    }
    strings.push(combined);
  }
  return strings;
}

interface RawAccumulator {
  sumVitima: number;
  hasVitima: boolean;
  sumTotal: number;
  hasTotal: boolean;
  sumPeso: number;
  hasPeso: boolean;
  sumFeminino: number;
  hasFeminino: boolean;
  sumMasculino: number;
  hasMasculino: boolean;
  sumNaoInformado: number;
  hasNaoInformado: boolean;
  rowCount: number;
}

function parseOptionalNumber(raw: string | null): number | null {
  if (raw === null || raw === '') return null;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}

function processBancoVde2025(xlsxPath: string): {
  accumulators: Map<string, RawAccumulator>;
  totalRowsRead: number;
  estadualRowsRead: number;
} {
  console.log(`2/4 Lendo arquivo oficial ${xlsxPath}...`);
  if (!fs.existsSync(xlsxPath)) {
    throw new Error(
      `Arquivo não encontrado em "${xlsxPath}". Coloque o BancoVDE 2025.xlsx em raw-data/BancoVDE 2025.xlsx.`
    );
  }

  const zipBuffer = fs.readFileSync(xlsxPath);
  const entries = readZipCentralDirectory(zipBuffer);

  const sharedStringsEntry = entries.get('xl/sharedStrings.xml');
  const sharedStrings = sharedStringsEntry
    ? parseSharedStrings(extractZipEntryBuffer(zipBuffer, sharedStringsEntry).toString('utf8'))
    : [];

  const sheetEntry = entries.get('xl/worksheets/sheet1.xml');
  if (!sheetEntry) {
    throw new Error('Aba principal (xl/worksheets/sheet1.xml) não encontrada no BancoVDE 2025.xlsx.');
  }

  const sheetXml = extractZipEntryBuffer(zipBuffer, sheetEntry).toString('utf8');

  const accumulators = new Map<string, RawAccumulator>();
  let totalRowsRead = 0;
  let estadualRowsRead = 0;
  let colMap: Record<string, number> | null = null;

  const rowRegex = /<row\b[^>]*>([\s\S]*?)<\/row>/g;
  const cellRegex = /<c\b([^>]*)>([\s\S]*?)<\/c>/g;
  const refAttrRegex = /\br="([A-Z]+)\d+"/;
  const typeAttrRegex = /\bt="([^"]+)"/;
  const valTagRegex = /<v>([\s\S]*?)<\/v>/;
  const inlineStrRegex = /<is>[\s\S]*?<t[^>]*>([\s\S]*?)<\/t>[\s\S]*?<\/is>/;

  let rowMatch: RegExpExecArray | null;
  let isHeaderRow = true;

  while ((rowMatch = rowRegex.exec(sheetXml)) !== null) {
    const rowContent = rowMatch[1];
    const cells: Array<string | null> = new Array(14).fill(null);

    cellRegex.lastIndex = 0;
    let cellMatch: RegExpExecArray | null;
    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      const attrs = cellMatch[1];
      const inner = cellMatch[2];

      const refMatch = refAttrRegex.exec(attrs);
      if (!refMatch) continue;
      const colIdx = columnLettersToIndex(refMatch[1]);

      const typeMatch = typeAttrRegex.exec(attrs);
      const cellType = typeMatch ? typeMatch[1] : 'n';

      if (cellType === 'inlineStr') {
        const isMatch = inlineStrRegex.exec(inner);
        cells[colIdx] = isMatch ? decodeXmlEntities(isMatch[1]) : null;
      } else {
        const vMatch = valTagRegex.exec(inner);
        if (!vMatch) {
          cells[colIdx] = null;
        } else if (cellType === 's') {
          const strIdx = Number.parseInt(vMatch[1], 10);
          cells[colIdx] = sharedStrings[strIdx] ?? null;
        } else {
          cells[colIdx] = vMatch[1];
        }
      }
    }

    if (isHeaderRow) {
      isHeaderRow = false;
      colMap = {};
      cells.forEach((name, idx) => {
        if (name) colMap![name.trim()] = idx;
      });
      const requiredCols = [
        'uf',
        'evento',
        'feminino',
        'masculino',
        'nao_informado',
        'total_vitima',
        'total',
        'total_peso',
        'abrangencia',
      ];
      for (const req of requiredCols) {
        if (colMap[req] === undefined) {
          throw new Error(`Coluna obrigatória "${req}" ausente no cabeçalho do BancoVDE 2025.xlsx.`);
        }
      }
      continue;
    }

    totalRowsRead++;

    const abrangencia = cells[colMap!['abrangencia']];
    if (abrangencia !== 'Estadual') {
      continue;
    }

    estadualRowsRead++;

    const uf = (cells[colMap!['uf']] || '').trim().toUpperCase();
    const evento = (cells[colMap!['evento']] || '').trim();
    if (!uf || !evento) {
      throw new Error(`Linha ${totalRowsRead} com UF ou evento vazio.`);
    }

    const key = `${uf}::${evento}`;
    let acc = accumulators.get(key);
    if (!acc) {
      acc = {
        sumVitima: 0,
        hasVitima: false,
        sumTotal: 0,
        hasTotal: false,
        sumPeso: 0,
        hasPeso: false,
        sumFeminino: 0,
        hasFeminino: false,
        sumMasculino: 0,
        hasMasculino: false,
        sumNaoInformado: 0,
        hasNaoInformado: false,
        rowCount: 0,
      };
      accumulators.set(key, acc);
    }

    acc.rowCount++;

    const vVit = parseOptionalNumber(cells[colMap!['total_vitima']]);
    const vTot = parseOptionalNumber(cells[colMap!['total']]);
    const vPeso = parseOptionalNumber(cells[colMap!['total_peso']]);
    const vFem = parseOptionalNumber(cells[colMap!['feminino']]);
    const vMasc = parseOptionalNumber(cells[colMap!['masculino']]);
    const vNInf = parseOptionalNumber(cells[colMap!['nao_informado']]);

    if (vVit !== null) {
      acc.sumVitima += vVit;
      acc.hasVitima = true;
    }
    if (vTot !== null) {
      acc.sumTotal += vTot;
      acc.hasTotal = true;
    }
    if (vPeso !== null) {
      acc.sumPeso += vPeso;
      acc.hasPeso = true;
    }
    if (vFem !== null) {
      acc.sumFeminino += vFem;
      acc.hasFeminino = true;
    }
    if (vMasc !== null) {
      acc.sumMasculino += vMasc;
      acc.hasMasculino = true;
    }
    if (vNInf !== null) {
      acc.sumNaoInformado += vNInf;
      acc.hasNaoInformado = true;
    }
  }

  console.log(
    `    OK: ${totalRowsRead.toLocaleString('pt-BR')} linhas lidas | ${estadualRowsRead.toLocaleString('pt-BR')} linhas de abrangência Estadual agregadas.`
  );

  return { accumulators, totalRowsRead, estadualRowsRead };
}

function buildAndValidateIndicators(
  populations: StatePopulationEntry[],
  accumulators: Map<string, RawAccumulator>
): StateCrimeIndicatorEntry[] {
  console.log('3/4 Cruzando indicadores estaduais com população IBGE e executando validações...');

  const popByUf = new Map<string, StatePopulationEntry>();
  for (const p of populations) {
    popByUf.set(p.uf, p);
  }

  const results: StateCrimeIndicatorEntry[] = [];

  for (const ufEntry of populations) {
    for (const indicator of INDICATOR_CATALOG) {
      const key = `${ufEntry.uf}::${indicator.rawEventName}`;
      const acc = accumulators.get(key);

      if (!acc) {
        throw new Error(
          `Falha de integridade: combinação UF=${ufEntry.uf} e Evento="${indicator.rawEventName}" não encontrada no BancoVDE 2025.`
        );
      }

      let value: number | null = null;
      if (indicator.unit === 'victims') {
        if (acc.hasTotal || acc.hasPeso) {
          throw new Error(
            `Mistura de unidades detectada em ${ufEntry.uf} / ${indicator.rawEventName}: esperado apenas total_vitima.`
          );
        }
        value = acc.hasVitima ? Math.round(acc.sumVitima) : null;
      } else if (indicator.unit === 'occurrences') {
        if (acc.hasVitima || acc.hasPeso) {
          throw new Error(
            `Mistura de unidades detectada em ${ufEntry.uf} / ${indicator.rawEventName}: esperado apenas total.`
          );
        }
        value = acc.hasTotal ? Math.round(acc.sumTotal) : null;
      } else if (indicator.unit === 'kg') {
        if (acc.hasVitima || acc.hasTotal) {
          throw new Error(
            `Mistura de unidades detectada em ${ufEntry.uf} / ${indicator.rawEventName}: esperado apenas total_peso.`
          );
        }
        value = acc.hasPeso ? Number(acc.sumPeso.toFixed(3)) : null;
      }

      let sexBreakdown: StateCrimeIndicatorEntry['sexBreakdown'] = null;
      if (indicator.unit === 'victims') {
        const fem = acc.hasFeminino ? Math.round(acc.sumFeminino) : null;
        const masc = acc.hasMasculino ? Math.round(acc.sumMasculino) : null;
        const nInf = acc.hasNaoInformado ? Math.round(acc.sumNaoInformado) : null;

        if (value !== null) {
          const sumSex = (fem ?? 0) + (masc ?? 0) + (nInf ?? 0);
          if (sumSex !== value) {
            throw new Error(
              `Divergência de sexo em ${ufEntry.uf} / ${indicator.rawEventName}: total_vitima=${value} vs soma_sexo=${sumSex}`
            );
          }
        }
        sexBreakdown = { feminino: fem, masculino: masc, naoInformado: nInf };
      }

      let ratePer100k: number | null = null;
      if (indicator.comparisonMethod === 'population_per_100k' && value !== null) {
        ratePer100k = Number(((value / ufEntry.population) * 100_000).toFixed(2));
      }

      results.push({
        year: 2025,
        uf: ufEntry.uf,
        stateName: ufEntry.stateName,
        indicatorId: indicator.id,
        rawEventName: indicator.rawEventName,
        label: indicator.label,
        category: indicator.category,
        scope: 'Estadual',
        granularity: indicator.granularity,
        unit: indicator.unit,
        unitLabel: indicator.unitLabel,
        comparisonMethod: indicator.comparisonMethod,
        value,
        sexBreakdown,
        population: ufEntry.population,
        ratePer100k,
        source: 'MJSP / Sinesp VDE (BancoVDE 2025.xlsx)',
      });
    }
  }

  const referenceChecks: Array<{ uf: string; indicatorId: string; expected: number | null }> = [
    { uf: 'BA', indicatorId: 'homicidio-doloso', expected: 3663 },
    { uf: 'BA', indicatorId: 'feminicidio', expected: 102 },
    { uf: 'BA', indicatorId: 'latrocinio', expected: 60 },
    { uf: 'BA', indicatorId: 'estupro', expected: 1139 },
    { uf: 'BA', indicatorId: 'roubo-de-veiculo', expected: 9497 },
    { uf: 'BA', indicatorId: 'furto-de-veiculo', expected: 7282 },
    { uf: 'BA', indicatorId: 'trafico-de-drogas', expected: 8475 },
    { uf: 'BA', indicatorId: 'apreensao-cocaina', expected: 1487.083 },
    { uf: 'SP', indicatorId: 'homicidio-doloso', expected: 2257 },
    { uf: 'SP', indicatorId: 'feminicidio', expected: 270 },
    { uf: 'SP', indicatorId: 'latrocinio', expected: 131 },
    { uf: 'SP', indicatorId: 'estupro', expected: 3491 },
    { uf: 'SP', indicatorId: 'roubo-de-veiculo', expected: 25024 },
    { uf: 'SP', indicatorId: 'furto-de-veiculo', expected: 87334 },
    { uf: 'SP', indicatorId: 'trafico-de-drogas', expected: 45507 },
    { uf: 'SP', indicatorId: 'apreensao-cocaina', expected: 36628.036 },
    { uf: 'MG', indicatorId: 'apreensao-cocaina', expected: null },
    { uf: 'RJ', indicatorId: 'apreensao-cocaina', expected: null },
    { uf: 'MG', indicatorId: 'apreensao-maconha', expected: null },
    { uf: 'RJ', indicatorId: 'apreensao-maconha', expected: null },
    { uf: 'DF', indicatorId: 'feminicidio', expected: 28 },
    { uf: 'DF', indicatorId: 'mandado-prisao-cumprido', expected: 8449 },
  ];

  for (const check of referenceChecks) {
    const found = results.find((r) => r.uf === check.uf && r.indicatorId === check.indicatorId);
    if (!found || found.value !== check.expected) {
      throw new Error(
        `Reconciliação falhou para ${check.uf} / ${check.indicatorId}: esperado ${check.expected}, obtido ${found?.value}`
      );
    }
  }

  console.log(
    `    OK: ${results.length} registros estaduais gerados (${populations.length} UFs × ${INDICATOR_CATALOG.length} indicadores) e 100% reconciliados.`
  );
  return results;
}

async function main(): Promise<void> {
  const rootDir = process.cwd();
  const xlsxPath = path.join(rootDir, 'data', 'raw', 'BancoVDE 2025.xlsx');
  const outPopPath = path.join(rootDir, 'src', 'data', 'statePopulation.json');
  const outIndPath = path.join(rootDir, 'src', 'data', 'stateIndicators.json');

  const populations = await fetchAndValidateIbgePopulation2025();
  const { accumulators, totalRowsRead } = processBancoVde2025(xlsxPath);

  if (totalRowsRead !== 832_302) {
    throw new Error(
      `Validação falhou: esperado 832.302 linhas no BancoVDE 2025.xlsx, lido ${totalRowsRead}.`
    );
  }

  const indicators = buildAndValidateIndicators(populations, accumulators);

  console.log('4/4 Gravando datasets validados em src/data/...');
  fs.mkdirSync(path.dirname(outPopPath), { recursive: true });
  fs.writeFileSync(outPopPath, JSON.stringify(populations, null, 2) + '\n', 'utf8');
  fs.writeFileSync(outIndPath, JSON.stringify(indicators, null, 2) + '\n', 'utf8');

  console.log('\nConcluído com sucesso!');
  console.log(`- ${outPopPath}`);
  console.log(`- ${outIndPath}`);
}

main().catch((err) => {
  console.error('\n[ERRO DE VALIDAÇÃO ETL — GERAÇÃO INTERROMPIDA]');
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});