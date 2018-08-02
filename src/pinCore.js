'use strict';

class PinCore {

    /**
     *
     * @param options
     */
    constructor(options = {}) {
        let defaults = {
            debug: false,
            mail: 'strongMail',
            username: "strongUsername",
            password: "strongPass",


        };
        this._config = Object.assign({}, defaults, options);
    }

    get config() {
        return this._config;
    }

    /**
     *
     * @param obj
     * @param obj1
     */
    log(obj, obj1 = null) {
        if (this._config.debug) {
            if (obj1 == null) {
                console.log(obj);
            } else {
                console.log(obj, obj1);

            }
        }
        return null;
    }

    /**
     *
     * @param ms
     * @returns {Promise<any>}
     */
    waitFor(ms) {
        return new Promise(r => setTimeout(r, ms))
    }


    /**
     *
     * @param user_active_date
     * @returns {number}
     */
    static userActiveDate(user_active_date){

        var cln_date         = new Date(user_active_date);
        var date_now         = new Date();
        var timeDiff         = Math.abs(cln_date.getTime() - date_now.getTime());

        return Math.ceil(timeDiff / (1000 * 3600 * 24));
    }

    /**
     *
     * @param obj
     * @returns {*}
     */
    resourceResponse(obj) {
        /**
         * @param {{resource_response:string}} response
         */
        var response = JSON.parse(obj);
        return response.resource_response;

    }

    /**
     *
     * @param obj
     * @returns {*}
     */
    getResource(obj) {

        /**
         * @param {{response:string}} response
         */
        var response = JSON.parse(obj);
        return response.resource;


    }

}


module.exports = PinCore;
