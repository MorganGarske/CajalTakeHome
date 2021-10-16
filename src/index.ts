#!/usr/bin/env node

import {createWriteStream} from 'fs';
import * as path from 'path';
import * as barcodeProcessor from './barcodeProcessor';

const [anchor, pathToData] = [...process.argv.slice(2, 4)];

if (anchor === undefined || pathToData === undefined) {
  console.warn('Usage:\n barcode <anchor_sequence> <path_to_fastq_file>');
} else {
  barcodeProcessor.processFastq(pathToData, anchor, (barcodes, error) => {
    if (error !== null) {
      throw error;
    }

    console.time('reduce by hamming');
    barcodeProcessor.reduceByHamming(barcodes, 1);
    console.timeEnd('reduce by hamming');

    const writeStream = createWriteStream(`./out/${path.parse(pathToData).name}.out`);

    for (const [k, v] of Array.from(barcodes.entries()).sort((a, b) => b[1] - a[1])) {
      writeStream.write(`${k},${v}\n`);
    }

    console.log(`final barcodes: ${barcodes.size}`);
    writeStream.end();
  });
}
