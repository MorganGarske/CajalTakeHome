import {expect} from 'chai';
import {unlinkSync, writeFileSync} from 'fs';
import {processFastq, reduceByHamming} from '/users/aarde/workspace/cajaltakehome/lib/barcodeprocessor';

describe('processFastq', () => {
  writeFileSync('./data.fastq', `@VH00272:1:AAAJ3MHM5:1:2610:25351:32123 2:N:0:ATCACGATCG+CGACTCCTAC
  GGGGGTCATATCCGCCGCGGAGTAGGATTTCGTACTGCGGCCGCTACCTAATTGCCGTCGTGAGGTACGACCACCGCTA
  +
  ;CCCC;C-C-CCCCCCCCCC-CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC;CCCCCCC;CC-
  @VH00272:1:AAAJ3MHM5:1:2610:26563:32123 2:N:0:ATCACGATCG+CGACTCCTAC
  GGGTCCACAGGGTCGGGGTAGTATGGGGAGCTGTACTGCGGCCGCTACCTAATTGCCGTCGTGAGGTACGACCACCGCT
  +
  CCCCCC;CC-CCCCCCCC;CCCCCCCCCCCCCCCCCCCC;-CCCCCCCCCCCC;CCC;CCCCCCCCCCC-CCCCCCCCC
  @VH00272:1:AAAJ3MHM5:1:1201:6567:30306 2:N:0:ATCACGATCG+CGACTCCTAC
  TGGGGTCATATCCGCCGCGGAGTAGGATTTAGTACTGCGGCCGCTACCTAATTGCCGTCGTTAGGTACGACCACCGCTA
  +
  CCCCC;CCCCCCCCCCCCCCCC-C-C;CCCCCCCCCCCCCCCCCCCCCCCC;C-;CCCCCCCCCCCCC-CCCCCCCCC;`);

  it('creates frequency map of apparant barcodes based on anchor sequence', () => {
    processFastq('./data.fastq', 'GTACTGCGGCCGCTACCTA', (barcodes) => {
      expect(barcodes).to.eql(new Map([['GGGGTCATATCCGCCGCGGAGTAGGATT', 2], ['GTCCACAGGGTCGGGGTAGTATGGGGAG', 1]]));
      unlinkSync('./data.fastq');
    });
  });
});

describe('reduceByHamming', () => {
  it('combines frequency of two barcodes that are within the specified hamming distance', () => {
    const barcodes = new Map([['GA', 10], ['GG', 10]]);
    reduceByHamming(barcodes, 1);
    expect(barcodes).to.eql(new Map([['GA', 20]]));
  });

  it('combines frequency into the barcode with the larger initial frequency', () => {
    const barcodes = new Map([['GA', 15], ['GG', 10]]);
    reduceByHamming(barcodes, 1);
    expect(barcodes).to.eql(new Map([['GA', 25]]));
  });

  it('does not impact barcode frequency if there are no hamming-n neighbors', () => {
    const barcodes = new Map([['GTA', 15], ['GGG', 10]]);
    reduceByHamming(barcodes, 1);
    expect(barcodes).to.eql(new Map([['GTA', 15], ['GGG', 10]]));
  });
});
