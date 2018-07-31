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
     */
    log(obj) {
        if (this._config.debug) {
            console.log(obj);
        }
        return null;
    }

    /**
     *
     * @param obj
     * @returns {*}
     */
    resourceResponse(obj){
       var response = JSON.parse(obj);
       return response.resource_response;

    }

}


module.exports = PinCore;
