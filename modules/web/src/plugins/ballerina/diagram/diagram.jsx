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

import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import CanvasDecorator from './views/default/components/decorators/canvas-decorator';
import PositionVisitor from './visitors/position-visitor';
import DimensionVisitor from './visitors/dimension-visitor';
import ErrorRenderer from './visitors/error-rendering-visitor';
import WorkerInvocationSyncVisitor from './visitors/worker-invocation-sync-visitor';
import InvocationArrowPositionVisitor from './visitors/worker-invocation-arrow-position-sync-visitor';
// import ArrowConflictResolver from '../visitors/arrow-conflict-resolver';
import Clean from './visitors/clean';
import OverlayComponentsRenderingVisitor from '../visitors/overlay-comp-rendering-visitor';
import {
    getComponentForNodeArray,
    getSizingUtil,
    getPositioningUtil,
    getWorkerInvocationSyncUtil,
    getInvocationArrowPositionUtil,
    getOverlayComponent,
    getConfig,
//    getErrorCollectorUtil,
} from './diagram-util';
import ActiveArbiter from './views/default/components/decorators/active-arbiter';
import CompilationUnitNode from './../model/tree/compilation-unit-node';
import TopLevelNodes from './views/default/components/nodes/top-level-nodes';
import ControllerPositioningUtil from './views/default/controller-positioning-util';
import ControllerVisitor from './visitors/controller-visitor';

const padding = 5;

/**
 * React component for diagram.
 *
 * @class Diagram
 * @extends {React.Component}
 */
class Diagram extends React.Component {

    /**
     * Creates an instance of Diagram.
     * @param {Object} props React properties.
     * @memberof Diagram
     */
    constructor(props) {
        super(props);
        this.dimentionVisitor = new DimensionVisitor();
        this.positionCalc = new PositionVisitor();
        this.errorRenderer = new ErrorRenderer();
        this.workerInvocationSynVisitor = new WorkerInvocationSyncVisitor();
        this.invocationArrowPositionVisitor = new InvocationArrowPositionVisitor();
    }

    /**
     * @override
     * @memberof Diagram
     */
    getChildContext() {
        return {
            astRoot: this.props.model,
            activeArbiter: new ActiveArbiter(),
            mode: this.props.mode,
            designer: getSizingUtil(this.props.mode),
        };
    }

    /**
     * @override
     * @memberof Diagram
     */
    render() {
        // Following is how we render the diagram.
        // 1 First clear any intermediate state we have set.
        this.props.model.accept(new Clean());

        // 2. We will visit the model tree and calculate width and height of all
        //    the elements. We will run the DimensionVisitor.
        this.dimentionVisitor.setSizingUtil(getSizingUtil(this.props.mode));
        this.props.model.accept(this.dimentionVisitor);

        // 3. We need to re adjust the worker invocation statements.
        const workerInvocationSyncUtil = getWorkerInvocationSyncUtil(this.props.mode);
        workerInvocationSyncUtil.setDefaultSizingUtil(getSizingUtil(this.props.mode));
        this.workerInvocationSynVisitor.setWorkerInvocationSyncUtil(workerInvocationSyncUtil);
        this.props.model.accept(this.workerInvocationSynVisitor);

        // 4 We need to adjest the width of the panel to accomodate width of the screen.
        // - This is done by passing the container width to position calculater to readjest.
        const viewState = this.props.model.viewState;
        viewState.container = {
            width: this.props.width - padding,
            height: this.props.height - padding,
        };
        // 5. Now we will visit the model again and calculate position of each node
        //    in the tree. We will use PositionCalcVisitor for this.
        this.positionCalc.setPositioningUtil(getPositioningUtil(this.props.mode));
        this.props.model.accept(this.positionCalc);

        // 6. Now we need to position the worker invocation arrows
        this.invocationArrowPositionVisitor
            .setWorkerInvocationPositionSyncUtil(getInvocationArrowPositionUtil(this.props.mode));
        this.props.model.accept(this.invocationArrowPositionVisitor);

        // 7. Now we will visit the model again and collect the errors of each node
        //    in the tree. We will use ErrorRenderer for this. This will only collect errors
        //    for default and compact view.
        /* if (this.props.mode !== 'action') { //TODOX
            this.errorRenderer.setErrorUtil(getErrorCollectorUtil(this.props.mode));
            this.props.model.accept(this.errorRenderer);
        } */

        /* TODOX
        // 2.1 Lets resolve arrow conflicts.
        this.props.model.accept(new ArrowConflictResolver());
        // we re run the dimention and possition calculator again there are any conflicts.
        this.props.model.accept(this.dimentionVisitor);
        this.props.model.accept(this.positionCalc);
        others = getComponentForNodeArray(otherNodes, this.props.mode);
         */

        // 3.1 lets filter out annotations so we can overlay html on top of svg.
        /* const annotationRenderer = new AnnotationRenderingVisitor();
        // this.props.model.accept(annotationRenderer); TODOX Disable annotations.
        let annotations = [];
        if (annotationRenderer.getAnnotations()) {
            annotations = getComponentForNodeArray(annotationRenderer.getAnnotations(), this.props.mode);
        } */

        // Filter out the overlay components so we can overlay html on top of svg.
        const overlayCompRender = new OverlayComponentsRenderingVisitor();
        this.props.model.accept(overlayCompRender);
        let overlayComponents = [];
        if (overlayCompRender.getOverlayComponents()) {
            overlayComponents = getOverlayComponent(overlayCompRender.getOverlayComponents(), this.props.mode);
        }

        // Filter out the errors collected so we can show them near the specific components
        /* const errorCollector = new ErrorCollectorVisitor();
        this.props.model.accept(errorCollector);
        let errorList = [];
        if (errorCollector.getErrors()) {
            errorList = getOverlayComponent(errorCollector.getErrors(), this.props.mode);
        } */

        const controllerVisitor = new ControllerVisitor();
        const cu = new ControllerPositioningUtil();
        cu.setContext(this.context);
        cu.setMode(this.props.mode);
        cu.setConfig(getConfig(this.props.mode));
        controllerVisitor.setControllerUtil(cu);
        this.props.model.accept(controllerVisitor);
        let controllers = controllerVisitor.getComponents();

        controllers = _.merge(controllers, overlayComponents);

        const tln = (this.props.model.getTopLevelNodes()) ? this.props.model.getTopLevelNodes() : [];
        const children = getComponentForNodeArray(tln, this.props.mode);

        // 4. Ok we are all set, now lets render the diagram with React. We will create
        //    a CsnvasDecorator and pass child components for that.
        return (<CanvasDecorator
            dropTarget={this.props.model}
            bBox={viewState.bBox}
            overlayComponents={controllers}
            disabled={this.props.disabled}
        >
            { children }
            <TopLevelNodes model={this.props.model} />
        </CanvasDecorator>);
    }
}

Diagram.propTypes = {
    model: PropTypes.instanceOf(CompilationUnitNode).isRequired,
    mode: PropTypes.string,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    disabled: PropTypes.bool.isRequired,
};

Diagram.contextTypes = {
    command: PropTypes.shape({
        on: PropTypes.func,
        dispatch: PropTypes.func,
    }).isRequired,
    editor: PropTypes.instanceOf(Object).isRequired,
    getDiagramContainer: PropTypes.instanceOf(Object).isRequired,
};

Diagram.childContextTypes = {
    astRoot: PropTypes.instanceOf(CompilationUnitNode).isRequired,
    mode: PropTypes.string,
    activeArbiter: PropTypes.instanceOf(ActiveArbiter).isRequired,
    designer: PropTypes.instanceOf(Object).isRequired,
};

Diagram.defaultProps = {
    mode: 'default',
    disabled: false,
};

export default Diagram;
