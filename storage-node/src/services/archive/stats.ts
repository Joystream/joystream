import { Logger } from 'winston'
import logger from '../../services/logger'
import _ from 'lodash'

type SizeDurationJobStats = {
  size: number
  start: bigint
  end: bigint
}

type DownloadJobStats = SizeDurationJobStats

type UploadJobStats = SizeDurationJobStats

type CompressionJobStats = SizeDurationJobStats & {
  sizeAfter: number
}

export class StatsCollectingService {
  private logger: Logger
  private downloadJobsStats: DownloadJobStats[] = []
  private uploadJobsStats: UploadJobStats[] = []
  private compressionJobsStats: CompressionJobStats[] = []

  constructor() {
    this.logger = logger.child({ label: 'StatsCollectingService' })
  }

  public addDownloadJobStats(stats: DownloadJobStats): void {
    this.downloadJobsStats.push(stats)
  }

  public addUploadJobStats(stats: UploadJobStats): void {
    this.uploadJobsStats.push(stats)
  }

  public addCompressionJobStats(stats: CompressionJobStats): void {
    this.compressionJobsStats.push(stats)
  }

  // Convert time in miliseconds to an `HH:MM:SS.XX` string
  private humanizeDuration(durationMs: number): string {
    const hours = Math.floor(durationMs / 1000 / 60 / 60)
    const minutes = Math.floor((durationMs / 1000 / 60) % 60)
    const seconds = Math.floor((durationMs / 1000) % 60)
    const miniseconds = Math.floor((durationMs % 1000) / 10)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}.${miniseconds.toString().padStart(2, '0')}`
  }

  private toMs(ns: bigint) {
    return Number(ns / BigInt(1_000_000))
  }

  private countTotalDurationMs(source: SizeDurationJobStats[]): number {
    if (source.length === 0) {
      // Prevent division by 0
      return 1
    }

    // Because jobs are executed in parallel, we "merge" start/end times
    // when they overlap.
    const jobs = _.sortBy(source, (job) => job.start)
    let mergedRange: [bigint, bigint] = [jobs[0].start, jobs[0].end]
    const mergedRanges: [bigint, bigint][] = []
    for (const job of jobs) {
      const start = job.start
      const end = job.end
      if (start <= mergedRange[1]) {
        mergedRange[1] = end > mergedRange[1] ? end : mergedRange[1]
      } else {
        mergedRanges.push(mergedRange)
        mergedRange = [start, end]
      }
    }
    mergedRanges.push(mergedRange)

    return this.toMs(mergedRanges.reduce((a, b) => a + (b[1] - b[0]), BigInt(0)))
  }

  private sizeDurationStats(source: SizeDurationJobStats[]): string {
    const totalSize = source.reduce((a, b) => a + b.size, 0)
    const totalDuration = this.countTotalDurationMs(source)
    const numFiles = source.length

    const totalSizeGB = (totalSize / 1_000_000_000).toFixed(2)
    const totalDurationH = this.humanizeDuration(totalDuration)
    const MBps = (totalSize / 1_000_000 / (totalDuration / 1000)).toFixed(2)

    return `num_files=${numFiles}, total_size=${totalSizeGB}GB, total_duration=${totalDurationH}, avg_speed=${MBps}MB/s`
  }

  public logDownloadSummary(): void {
    this.logger.info(`Download summary: ${this.sizeDurationStats(this.downloadJobsStats)}`)
  }

  public logUploadSummary(): void {
    this.logger.info(`Upload summary: ${this.sizeDurationStats(this.uploadJobsStats)}`)
  }

  public logCompressionSummary(): void {
    const totalSizeBefore = this.compressionJobsStats.reduce((a, b) => a + b.size, 0)
    const totalSizeAfter = this.compressionJobsStats.reduce((a, b) => a + b.sizeAfter, 0)
    const totalSizeReduction = totalSizeBefore - totalSizeAfter

    const totalSizeAfterGB = (totalSizeAfter / 1_000_000_000).toFixed(2)
    const reducitonPercentage = ((totalSizeReduction / totalSizeBefore) * 100).toFixed(2)

    this.logger.info(
      `Compression summary: ${this.sizeDurationStats(
        this.compressionJobsStats
      )}, total_archives_size=${totalSizeAfterGB}GB, avg_size_reduction=${reducitonPercentage}%`
    )
  }

  public logSummaries(): void {
    this.logDownloadSummary()
    this.logUploadSummary()
    this.logCompressionSummary()
  }
}
