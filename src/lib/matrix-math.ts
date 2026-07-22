export type MatrixOperation =
  | "add"
  | "subtract"
  | "multiply"
  | "transpose"
  | "determinant"
  | "inverse"
  | "rref";

export type Matrix = number[][];

const EPSILON = 1e-9;

export function createMatrix(rows: number, cols: number, fill = 0): Matrix {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => fill));
}

export function createGrid<T>(rows: number, cols: number, fill: T): T[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => fill));
}

export function cloneMatrix<T>(matrix: T[][]): T[][] {
  return matrix.map((row) => [...row]);
}

export function resizeMatrix(matrix: Matrix, rows: number, cols: number): Matrix {
  return Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) => matrix[i]?.[j] ?? 0)
  );
}

export function formatNumber(value: number | null): string {
  if (value === null) return "·";
  if (!Number.isFinite(value)) return "—";
  const rounded = Math.round(value * 1e6) / 1e6;
  return Object.is(rounded, -0) ? "0" : rounded.toString();
}

export interface Cell {
  row: number;
  col: number;
}

export function validateOperation(
  operation: MatrixOperation,
  rowsA: number,
  colsA: number,
  rowsB: number,
  colsB: number
): string | null {
  switch (operation) {
    case "add":
    case "subtract":
      if (rowsA !== rowsB || colsA !== colsB) {
        return `Matrices must be the same size to ${operation === "add" ? "add" : "subtract"}. A is ${rowsA}×${colsA}, B is ${rowsB}×${colsB}.`;
      }
      return null;
    case "multiply":
      if (colsA !== rowsB) {
        return `To multiply A × B, A's column count must equal B's row count. A is ${rowsA}×${colsA}, B is ${rowsB}×${colsB}.`;
      }
      return null;
    case "determinant":
    case "inverse":
      if (rowsA !== colsA) {
        return `${operation === "determinant" ? "Determinant" : "Inverse"} requires a square matrix. A is ${rowsA}×${colsA}.`;
      }
      return null;
    case "transpose":
    case "rref":
      return null;
  }
}

// ---------- Element-wise style steps (add / subtract / multiply / transpose) ----------

export interface ElementwiseStep {
  description: string;
  result: (number | null)[][];
  highlightA: Cell[];
  highlightB: Cell[];
  resultCell: Cell | null;
}

export function addSubtractSteps(
  a: Matrix,
  b: Matrix,
  operation: "add" | "subtract"
): { steps: ElementwiseStep[]; result: Matrix } {
  const rows = a.length;
  const cols = a[0].length;
  const result: (number | null)[][] = createGrid(rows, cols, null);
  const steps: ElementwiseStep[] = [
    {
      description: `Both matrices are ${rows}×${cols}, so we can ${operation === "add" ? "add" : "subtract"} them element-by-element.`,
      result: cloneMatrix(result),
      highlightA: [],
      highlightB: [],
      resultCell: null,
    },
  ];

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const av = a[i][j];
      const bv = b[i][j];
      const value = operation === "add" ? av + bv : av - bv;
      result[i][j] = value;
      const symbol = operation === "add" ? "+" : "-";
      steps.push({
        description: `C[${i + 1}][${j + 1}] = A[${i + 1}][${j + 1}] ${symbol} B[${i + 1}][${j + 1}] = ${formatNumber(av)} ${symbol} ${formatNumber(bv)} = ${formatNumber(value)}`,
        result: cloneMatrix(result),
        highlightA: [{ row: i, col: j }],
        highlightB: [{ row: i, col: j }],
        resultCell: { row: i, col: j },
      });
    }
  }

  steps.push({
    description: `Done — the result is a ${rows}×${cols} matrix.`,
    result: cloneMatrix(result),
    highlightA: [],
    highlightB: [],
    resultCell: null,
  });

  return { steps, result: result as Matrix };
}

export function multiplySteps(a: Matrix, b: Matrix): { steps: ElementwiseStep[]; result: Matrix } {
  const rowsA = a.length;
  const colsA = a[0].length;
  const colsB = b[0].length;
  const result: (number | null)[][] = createGrid(rowsA, colsB, null);
  const steps: ElementwiseStep[] = [
    {
      description: `A is ${rowsA}×${colsA} and B is ${colsA}×${colsB}, so the result C will be ${rowsA}×${colsB}.`,
      result: cloneMatrix(result),
      highlightA: [],
      highlightB: [],
      resultCell: null,
    },
  ];

  for (let i = 0; i < rowsA; i++) {
    for (let j = 0; j < colsB; j++) {
      const terms: string[] = [];
      let sum = 0;
      for (let k = 0; k < colsA; k++) {
        terms.push(`${formatNumber(a[i][k])}×${formatNumber(b[k][j])}`);
        sum += a[i][k] * b[k][j];
      }
      result[i][j] = sum;
      steps.push({
        description: `C[${i + 1}][${j + 1}] = ${terms.join(" + ")} = ${formatNumber(sum)}`,
        result: cloneMatrix(result),
        highlightA: Array.from({ length: colsA }, (_, k) => ({ row: i, col: k })),
        highlightB: Array.from({ length: colsA }, (_, k) => ({ row: k, col: j })),
        resultCell: { row: i, col: j },
      });
    }
  }

  steps.push({
    description: `Done — the result is ${rowsA}×${colsB}.`,
    result: cloneMatrix(result),
    highlightA: [],
    highlightB: [],
    resultCell: null,
  });

  return { steps, result: result as Matrix };
}

export function transposeSteps(a: Matrix): { steps: ElementwiseStep[]; result: Matrix } {
  const rows = a.length;
  const cols = a[0].length;
  const result: (number | null)[][] = createGrid(cols, rows, null);
  const steps: ElementwiseStep[] = [
    {
      description: `Transposing flips a ${rows}×${cols} matrix into a ${cols}×${rows} matrix: Aᵀ[j][i] = A[i][j].`,
      result: cloneMatrix(result),
      highlightA: [],
      highlightB: [],
      resultCell: null,
    },
  ];

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[j][i] = a[i][j];
      steps.push({
        description: `Aᵀ[${j + 1}][${i + 1}] = A[${i + 1}][${j + 1}] = ${formatNumber(a[i][j])}`,
        result: cloneMatrix(result),
        highlightA: [{ row: i, col: j }],
        highlightB: [],
        resultCell: { row: j, col: i },
      });
    }
  }

  steps.push({
    description: "Done.",
    result: cloneMatrix(result),
    highlightA: [],
    highlightB: [],
    resultCell: null,
  });

  return { steps, result: result as Matrix };
}

// ---------- Elimination style steps (determinant / inverse / rref) ----------

export interface EliminationStep {
  description: string;
  matrix: Matrix;
  highlightRows: number[];
}

export function determinantSteps(a: Matrix): {
  steps: EliminationStep[];
  determinant: number;
  singular: boolean;
} {
  const n = a.length;
  const working = cloneMatrix(a);
  let sign = 1;
  const steps: EliminationStep[] = [
    { description: "Reduce A to upper-triangular form using Gaussian elimination.", matrix: cloneMatrix(working), highlightRows: [] },
  ];

  for (let c = 0; c < n; c++) {
    let pivotRow = c;
    for (let r = c + 1; r < n; r++) {
      if (Math.abs(working[r][c]) > Math.abs(working[pivotRow][c])) pivotRow = r;
    }

    if (Math.abs(working[pivotRow][c]) < EPSILON) {
      steps.push({
        description: `Column ${c + 1} has no nonzero pivot below row ${c + 1} — the determinant is 0.`,
        matrix: cloneMatrix(working),
        highlightRows: [],
      });
      return { steps, determinant: 0, singular: true };
    }

    if (pivotRow !== c) {
      [working[c], working[pivotRow]] = [working[pivotRow], working[c]];
      sign *= -1;
      steps.push({
        description: `Swap R${c + 1} and R${pivotRow + 1} to bring the largest pivot into place (sign flips to ${sign > 0 ? "+" : "−"}).`,
        matrix: cloneMatrix(working),
        highlightRows: [c, pivotRow],
      });
    }

    for (let r = c + 1; r < n; r++) {
      const factor = working[r][c] / working[c][c];
      if (Math.abs(factor) > EPSILON) {
        working[r] = working[r].map((v, j) => v - factor * working[c][j]);
        steps.push({
          description: `R${r + 1} = R${r + 1} − (${formatNumber(factor)}) × R${c + 1} to clear column ${c + 1}.`,
          matrix: cloneMatrix(working),
          highlightRows: [c, r],
        });
      }
    }
  }

  const diagonal = working.map((row, i) => row[i]);
  const diagonalProduct = diagonal.reduce((acc, v) => acc * v, 1);
  const determinant = sign * diagonalProduct;

  steps.push({
    description: `Multiply the diagonal entries: ${sign < 0 ? "−" : ""}(${diagonal.map(formatNumber).join(" × ")}) = ${formatNumber(determinant)}.`,
    matrix: cloneMatrix(working),
    highlightRows: [],
  });

  return { steps, determinant, singular: false };
}

export function inverseSteps(a: Matrix): {
  steps: EliminationStep[];
  inverse: Matrix | null;
  singular: boolean;
} {
  const n = a.length;
  const working: Matrix = a.map((row, i) => [...row, ...Array.from({ length: n }, (_, k) => (k === i ? 1 : 0))]);
  const steps: EliminationStep[] = [
    { description: "Augment A with the identity matrix to form [A | I].", matrix: cloneMatrix(working), highlightRows: [] },
  ];

  for (let c = 0; c < n; c++) {
    let pivotRow = c;
    for (let r = c + 1; r < n; r++) {
      if (Math.abs(working[r][c]) > Math.abs(working[pivotRow][c])) pivotRow = r;
    }

    if (Math.abs(working[pivotRow][c]) < EPSILON) {
      steps.push({
        description: `Column ${c + 1} has no usable pivot — matrix A is singular and has no inverse.`,
        matrix: cloneMatrix(working),
        highlightRows: [],
      });
      return { steps, inverse: null, singular: true };
    }

    if (pivotRow !== c) {
      [working[c], working[pivotRow]] = [working[pivotRow], working[c]];
      steps.push({
        description: `Swap R${c + 1} and R${pivotRow + 1} to get a nonzero pivot.`,
        matrix: cloneMatrix(working),
        highlightRows: [c],
      });
    }

    const pivotValue = working[c][c];
    if (Math.abs(pivotValue - 1) > EPSILON) {
      working[c] = working[c].map((v) => v / pivotValue);
      steps.push({
        description: `R${c + 1} = R${c + 1} ÷ ${formatNumber(pivotValue)} to make the pivot 1.`,
        matrix: cloneMatrix(working),
        highlightRows: [c],
      });
    }

    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const factor = working[r][c];
      if (Math.abs(factor) > EPSILON) {
        working[r] = working[r].map((v, j) => v - factor * working[c][j]);
        steps.push({
          description: `R${r + 1} = R${r + 1} − (${formatNumber(factor)}) × R${c + 1} to clear column ${c + 1}.`,
          matrix: cloneMatrix(working),
          highlightRows: [c, r],
        });
      }
    }
  }

  const inverse = working.map((row) => row.slice(n));
  steps.push({
    description: "The left half is now the identity matrix — the right half is A⁻¹.",
    matrix: cloneMatrix(working),
    highlightRows: [],
  });

  return { steps, inverse, singular: false };
}

export function rrefSteps(a: Matrix): { steps: EliminationStep[]; result: Matrix; rank: number } {
  const rows = a.length;
  const cols = a[0].length;
  const working = cloneMatrix(a);
  const steps: EliminationStep[] = [
    { description: "Reduce the matrix to Reduced Row Echelon Form using Gauss-Jordan elimination.", matrix: cloneMatrix(working), highlightRows: [] },
  ];

  let pivotRow = 0;
  for (let c = 0; c < cols && pivotRow < rows; c++) {
    let selected = pivotRow;
    for (let r = pivotRow + 1; r < rows; r++) {
      if (Math.abs(working[r][c]) > Math.abs(working[selected][c])) selected = r;
    }

    if (Math.abs(working[selected][c]) < EPSILON) {
      continue;
    }

    if (selected !== pivotRow) {
      [working[pivotRow], working[selected]] = [working[selected], working[pivotRow]];
      steps.push({
        description: `Swap R${pivotRow + 1} and R${selected + 1} to get a nonzero pivot in column ${c + 1}.`,
        matrix: cloneMatrix(working),
        highlightRows: [pivotRow],
      });
    }

    const pivotValue = working[pivotRow][c];
    if (Math.abs(pivotValue - 1) > EPSILON) {
      working[pivotRow] = working[pivotRow].map((v) => v / pivotValue);
      steps.push({
        description: `R${pivotRow + 1} = R${pivotRow + 1} ÷ ${formatNumber(pivotValue)} to make the pivot in column ${c + 1} equal to 1.`,
        matrix: cloneMatrix(working),
        highlightRows: [pivotRow],
      });
    }

    for (let r = 0; r < rows; r++) {
      if (r === pivotRow) continue;
      const factor = working[r][c];
      if (Math.abs(factor) > EPSILON) {
        working[r] = working[r].map((v, j) => v - factor * working[pivotRow][j]);
        steps.push({
          description: `R${r + 1} = R${r + 1} − (${formatNumber(factor)}) × R${pivotRow + 1} to clear column ${c + 1}.`,
          matrix: cloneMatrix(working),
          highlightRows: [pivotRow, r],
        });
      }
    }

    pivotRow++;
  }

  steps.push({
    description: `Done — the matrix is in reduced row echelon form. Rank = ${pivotRow}.`,
    matrix: cloneMatrix(working),
    highlightRows: [],
  });

  return { steps, result: working, rank: pivotRow };
}
