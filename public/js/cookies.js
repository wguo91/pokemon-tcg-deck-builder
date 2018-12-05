function setCookie(key, value, expirationDays) {
  let date = new Date();
  date.setTime(date.getTime() + (expirationDays*24*60*60*1000));
  let expireString = "expires=" + date.toUTCString();
  document.cookie = key + "=" + value + ";" + expireString + ";path=/";
};
