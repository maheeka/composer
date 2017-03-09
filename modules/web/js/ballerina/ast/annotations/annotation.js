/**
 * Copyright (c) 2017, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import ASTNode from '../node';

/**
 * Has children of type annotationKeyValue.
 */
class Annotation extends ASTNode {
    constructor(args) {
        super("Annotation");
        /**
         * The identifier/annotation name for the annotation with @ sign. Example: http:Method.
         * @type {string}
         */
        this._identifier = _.get(args, "identifier");
    }

    setIdentifier(identifier, options) {
        this.setAttribute('_identifier', identifier, options);
    }

    getIdentifier() {
        return this._identifier;
    }

    toString() {
        let annotationString = "@" + this._identifier;
        let childrenAsString = [];
        _.forEach(this.getChildren(), function (child) {
            childrenAsString.push(child.toString());
        });

        return annotationString + _.join(childrenAsString, ", ");
    }
}

export default Annotation;
