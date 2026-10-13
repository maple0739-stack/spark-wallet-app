export  default  {
    /**
     * 格式化时间 Unix 时间
     * @param UnixTime
     * @returns {string}
     * @constructor
     */
    FormatDateTime(UnixTime) {
        if(UnixTime && UnixTime>0){
            var a = UnixTime*1000;
            var date = new Date(parseInt(a));
            var y = date.getFullYear();
            var m = date.getMonth() + 1;
            m = m < 10 ? ('0' + m) : m;
            var d = date.getDate();
            d = d < 10 ? ('0' + d) : d;
            var h = date.getHours();
            h = h < 10 ? ('0' + h) : h;
            var minute = date.getMinutes();
            var second = date.getSeconds();
            minute = minute < 10 ? ('0' + minute) : minute;
            second = second < 10 ? ('0' + second) : second;
            return y + '-' + m + '-' + d + ' ' + h + ':' + minute + ':' + second;
        }else{
            return "0";
        }
    },
    /**
     * 计算相差的秒数
     * @param lasttime
     * @returns {number}
     */
    getSeconds(lasttime){
        if(lasttime){
            var date1= lasttime;  //开始时间
            var date2 = Math.round(new Date() / 1000);    //结束时间
            let second = parseInt((date1 - date2));
            if(second<0){
                second = 0;
            }
            return second;
        }else{
            return 0;
        }
    },
    getTime(start,end){
        var date1 = new Date(start);
        var date2 = new Date(end);
        var s1 = date1.getTime();
        var s2 = date2.getTime();//毫秒为单位
        var total = (s2 - s1);//每执行一次，减少时间差-1
        console.log("total",total)
        if(total > 0){
            var day = parseInt(total / (24 * 60 * 60)); //计算整数天数
            var afterDay = total - day * 24 * 60 * 60; //取得算出天数后剩余的秒数
            var hour = parseInt(afterDay / (60 * 60)); //计算整数小时数
            var afterHour = total - day * 24 * 60 * 60 - hour * 60 * 60; //取得算出小时数后剩余的秒数
            var min = parseInt(afterHour / 60); //计算整数分
            var afterMin = total - day * 24 * 60 * 60 - hour * 60 * 60 - min * 60;

            min = min < 10 ? ('0' + min) : min;
            afterMin = afterMin < 10 ? ('0' + afterMin) : afterMin;
            hour = hour < 10 ? ('0' + hour) : hour;
            let str = "";
            if(day>0){
                str = day + lan.t('all.day') + hour + lan.t('all.hour') + min + lan.t('all.minute') + afterMin + lan.t('all.second');
            }else if(hour>0){
                str = hour + lan.t('all.hour') + min + lan.t('all.minute') + afterMin + lan.t('all.second');
            }else if(min>0){
                str = min + lan.t('all.minute') + afterMin + lan.t('all.second');
            }else{
                str = afterMin + lan.t('all.second');
            }
            return str;
        }else{
            return 0
        }
    },
    getSecondTime(duration){
        var theTime = parseInt(duration);// 需要转换的时间秒
        var theTime1 = 0;// 分
        var theTime2 = 0;// 小时
        var theTime3 = 0;// 天
        if(theTime > 60) {
            theTime1 = parseInt(theTime/60);
            theTime = parseInt(theTime%60);
            if(theTime1 > 60) {
                theTime2 = parseInt(theTime1/60);
                theTime1 = parseInt(theTime1%60);
                if(theTime2 > 24){
                    //大于24小时
                    theTime3 = parseInt(theTime2/24);
                    theTime2 = parseInt(theTime2%24);
                }
            }
        }
        var result = '';
        if(theTime > 0){
            result = ""+parseInt(theTime)+lan.t('all.second');
        }
        if(theTime1 > 0) {
            result = ""+parseInt(theTime1)+lan.t('all.minute')+result;
        }
        if(theTime2 > 0) {
            result = ""+parseInt(theTime2)+lan.t('all.hour')+result;
        }
        if(theTime3 > 0) {
            result = ""+parseInt(theTime3)+lan.t('all.day')+result;
        }
        return result;
    }
}
