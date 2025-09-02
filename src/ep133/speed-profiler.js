// This file was obtained from the original sources owned by Teenage Engineering
// and is NOT covered by the GNU Affero General Public License that applies to the rest of the project.

export class SpeedProfiler {
  constructor() {
    this.downloadSpeeds = [];
    this.uploadSpeeds = [];
  }

  // Record a new download speed (in kb/s)
  addDownloadSpeed(speed) {
    this.downloadSpeeds.push(Math.floor(speed));
  }

  // Record a new upload speed (in kb/s)
  addUploadSpeed(speed) {
    this.uploadSpeeds.push(Math.floor(speed));
  }

  // Calculate average speed for download or upload
  calculateAverageSpeed(type) {
    const speeds = type === 'download' ? this.downloadSpeeds : this.uploadSpeeds;
    const total = speeds.reduce((sum, val) => sum + val, 0);
    return speeds.length > 0 ? Math.floor(total / speeds.length) : 0;
  }

  // Calculate median speed for download or upload
  calculateMedianSpeed(type) {
    const speeds = [...(type === 'download' ? this.downloadSpeeds : this.uploadSpeeds)].sort(
      (a, b) => a - b,
    );
    const middle = Math.floor(speeds.length / 2);
    return speeds.length % 2 === 0 ? (speeds[middle - 1] + speeds[middle]) / 2 : speeds[middle];
  }

  // Log current average and median speeds
  logSpeed(type) {
    switch (type) {
      case 'download':
        console.log('average download speed:', this.calculateAverageSpeed('download'), 'kb/s');
        console.log('median download speed:', this.calculateMedianSpeed('download'), 'kb/s');
        break;
      case 'upload':
        console.log('average upload speed:', this.calculateAverageSpeed('upload'), 'kb/s');
        console.log('median upload speed:', this.calculateMedianSpeed('upload'), 'kb/s');
        break;
    }
  }

  // Clear all recorded speeds
  resetSpeeds() {
    this.downloadSpeeds = [];
    this.uploadSpeeds = [];
  }
}
