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

import _ from 'lodash';
import SimpleBBox from './../../model/view/simple-bounding-box';

class ControllerVisitor {

    constructor() {
        this.components = [];
    }

    setControllerUtil(controllerUtil) {
        this.util = controllerUtil;
    }

    beginVisit() {
        // do nothing.
        return undefined;
    }

    endVisit(node) {
        if (_.isFunction(this.util[`position${node.getKind()}NodeControllers`])) {
            const elements = this.util[`position${node.getKind()}NodeControllers`](node);
            this.components = _.concat(this.components, elements);
        }
        return undefined;
    }

    getComponents() {
        return this.components;
    }
}

export default ControllerVisitor;
