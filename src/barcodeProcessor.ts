import * as fastq from 'bionode-fastq';
import * as hamming from 'compute-hamming';

/**
 * Takes a filepath and returns a map of unique barcodes to frequency.
 * @param {string} pathToData path to fastq file
 * @param {string} anchor anchor sequence
 * @param {function} callback function to accept the resulting barcode frequency map and perform desired action.
 * @return {void}
 */
export function processFastq(
    pathToData: string, anchor: string, callback: (barcodes: Map<string, number>, e: Error | null) => void): void {
  const fq = fastq.read(pathToData);

  const regex = new RegExp(anchor);

  const barcodes = new Map<string, number>();

  let countWithoutAnchor = 0;
  let countNotLongEnough = 0;
  let countTotal = 0;

  fq.on('data', (data: any) => {
    const seq = data.seq;
    const match = seq.match(regex);

    if (match !== null) {
      if (match.index >= 30) {
        const barcode = seq.substr(match.index - 30, 28);
        const count = barcodes.get(barcode);
        if (count !== undefined) barcodes.set(barcode, count + 1);
        else barcodes.set(barcode, 1);
      } else {
        countNotLongEnough++;
      }
    } else {
      countWithoutAnchor++;
    }
    countTotal++;
  });

  fq.on('end', () => {
    const badCount = countWithoutAnchor + countNotLongEnough;
    const goodCount = countTotal - badCount;
    const goodRatio = goodCount/countTotal;
    console.debug( {
      withoutAnchor: countWithoutAnchor,
      notLongEnough: countNotLongEnough,
      all: countTotal,
      bad: badCount,
      good: goodCount,
      goodRatio: goodRatio,
      uniqueBarcodes: barcodes.size,
    });
    callback(barcodes, null);
  });
  fq.on('error', (error: any) => callback(new Map(), error));
}

/**
 * Process a frequency map of unique barcodes - eliminate barcodes that are within the given
 * hamming distance in-place, and updates barcode frequency.
 * @param {string} barcodes frequency of each barcode in original file
 * @param {number} maxHammingDistance maximum hamming distance
 * @return {void}
 */
export function reduceByHamming(barcodes: Map<string, number>, maxHammingDistance: number): void {
  const uniqueBarcodes = Array.from(barcodes.entries());

  uniqueBarcodes.sort((a, b) => b[1] - a[1]);

  for (let i = 0; i < uniqueBarcodes.length; i++) {
    if (!barcodes.has(uniqueBarcodes[i][0])) {
      continue;
    }
    for (let j = i + 1; j < uniqueBarcodes.length; j++) {
      if (!barcodes.has(uniqueBarcodes[j][0])) {
        continue;
      }
      if (hamming(uniqueBarcodes[i][0], uniqueBarcodes[j][0]) <= maxHammingDistance) {
        const uniqueCount = barcodes.get(uniqueBarcodes[i][0]);
        if (uniqueCount !== undefined) {
          barcodes.set(uniqueBarcodes[i][0], uniqueCount + uniqueBarcodes[j][1]);
        }
        barcodes.delete(uniqueBarcodes[j][0]);
      }
    }
  }
}
