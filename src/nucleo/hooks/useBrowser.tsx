export const useBrowser = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.indexOf('chrome') > -1) {
      return 'Google Chrome';
    } else if (userAgent.indexOf('safari') > -1) {
      return 'Safari';
    } else if (userAgent.indexOf('firefox') > -1) {
      return 'Mozilla Firefox';
    } else if (userAgent.indexOf('opera') > -1 || userAgent.indexOf('opr') > -1) {
      return 'Opera';
    } else if (userAgent.indexOf('edge') > -1) {
      return 'Microsoft Edge';
    } else if (userAgent.indexOf('msie') > -1 || userAgent.indexOf('trident') > -1) {
      return 'Internet Explorer';
    } else {
      return 'Unknown';
    }
}