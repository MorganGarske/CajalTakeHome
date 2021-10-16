# Cajal Take Home

## Running
Requires Node.js (developed with v14.16.1) - [download](https://nodejs.org/en/download/)

- `npm install` to install dependencies.
- `npm install -g` to install `barcode` executable to system. Can run with `npx barcode <args>` or `barcode <args>` (if running scripts enabled)
- `npm test` to run tests, `npm run build` to run Typescript compiler and linter.
- `npm run clean` to clean lib and node_modules directories.

## Usage
`barcode <anchor_sequence> <path_to_fastq_file>`

e.g. `barcode GTACTGCGGCCGCTACCTA .\data\trunc_1000000.fastq`

Running will create a file in the ./out directory with the same filename and .out extension (e.g. `trunc_1000000.out`)

The .out file will contain comma separated barcodes and their frequencies found in the original file, compressing barcodes that are hamming-1 neighbors of other barcodes into higher-frequency barcodes. e.g. if barcode 'GAT' appears 10 times, and hamming-1 neighbor 'GAC' appears 9 times, "GAT,19" will appear in the .out file, and 'GAC' will be absent.

## Discussion
### Assumptions
* The 2-base spacer sequence is not significant to the barcode, so this is excluded when determining whether two apparent barcodes are the same when initially processing the fastq file, and is excluded from the output (note that the barcodes in the output are 28 bases long). If this is not the correct assumption, then change the `processFastq` function to use the full preceding 30 base sequence from the start of the anchor sequence - as opposed to current behavior of taking the first 28 of the 30 preceding bases.
* Sequences that do not contain the exact anchor sequence are not usable. Likewise, sequences that do not have 30 bases preceding the barcode are not usable. Together, these account for ~5% of the sample data provided.
* Quality data is not significant to determining the underlying barcodes. In the [study linked](https://pubmed.ncbi.nlm.nih.gov/27545715/), quality data was stripped. If this information is significant, then when reducing barcodes by hamming distance, we could consider the barcode that had the highest overall quality when determining which one to consider the 'true' barcode.
### Correctness
* "We expect that the real number of barcodes present is roughly the number of cells sequenced - and we know the number of cells sequenced". Provided the number of cells are known, it would seem that the top c barcodes, where c is the number of cells, would be the 'true' barcodes. When creating the .out file, we could accept as a parameter the number of cells, and truncate the output to only include the top c cells. This is also a critical factor in determining whether the output is consistent with what is expected.
### Scaling
* The algorithm to eliminate hamming-n neighbors is a brute force comparison of all unique apparent barcodes to all others, excluding barcodes that have already been compared. Thus, it's an O(n^2) algorithm, where n is the number of unique apparent barcodes. This runs in about 45 seconds on my laptop with i7-1065G7 CPU @ 1.30GHz for the 21,567 unique barcodes in the sample trunc_1000000.fastq file. I would need to understand what a typical data set looks like and how many data sets need to be processed in a given time to understand if this is acceptable. This program could be run in parallel to process multiple files at once, or even set up as an AWS Lambda function to process many files simultaneously, cost permitting.
* Next steps for scaling would be to investigate the [Simhash](http://matpalm.com/resemblance/simhash/) algorithm. This was developed to detect duplicates when web-crawling, and seems like it could have an application here to process large amounts of data in better time than the brute force approach.
### Observations
* Only 4995 of the 13239 'true' barcodes recognized by processing the sample file have >1 occurrence. I assume that this is not usable data, but would need to confer with a scientist that may help explain the meaning of this data.
* Reducing by hamming distance 1 eliminates only 39% apparent barcodes in the example file (8,329 of 21,567 apparent barcodes). This requires further discussion with a scientist, but this seems like a low reduction.
### Usage in Other Applications
* This NPM package exports the barcodeProcessor module for use in other applications. If this package is published to an NPM repository, other NPM packages can import the processFastq and reduceByHamming functions for usage e.g. in a program that processes multiple files in parallel. 
### Other
* I am logging information regarding the initial dataset to the debug console. This includes the number of sequences that could not be used, the ratio of usuable sequences, and the number of unique barcodes. This is something I would refer to when discussing the datasets with scientists, but may be something to remove in future iterations of the program.