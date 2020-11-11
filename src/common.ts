/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */
export interface DataViewObjectPropertyIdentifier {
    objectName: string;
    propertyName: string;
}

export interface DataViewObjectPropertyReference<T> {
    /** Property identifier that holds the Value. Only static properties (Null Selector) are supported */
    propertyIdentifier?: DataViewObjectPropertyIdentifier;

    /** Value to use if the PropertyDefinition does not exist */
    defaultValue: T;
}

/** Defines a selector for content, including data-, metadata, and user-defined repetition. */
export interface Selector {

    /** Metadata-bound repetition selection.  Refers to a DataViewMetadataColumn queryName. */
    metadata?: string;

    /** User-defined repetition selection. */
    id?: string;
}