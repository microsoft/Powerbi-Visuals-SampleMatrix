import powerbi from "powerbi-visuals-api";
import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { DataViewObjectPropertyReference, Selector } from "./common";
import { SubtotalProperties } from "./subtotalProperties";

import FormattingSettingsCard = formattingSettings.Card;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;
import DataViewObjects = powerbi.DataViewObjects;
import DataViewObject = powerbi.DataViewObject;
import DataViewHierarchyLevel = powerbi.DataViewHierarchyLevel;
import VisualObjectInstance = powerbi.VisualObjectInstance;

class GeneralViewCardSettings extends FormattingSettingsCard {
    opacity = new formattingSettings.NumUpDown({
        name: "opacity",
        displayNameKey: "Visual_BarsOpacity",
        value: 100,
        options: {
            minValue: {
                type: powerbi.visuals.ValidatorType.Min,
                value: 0,
            },
            maxValue: {
                type: powerbi.visuals.ValidatorType.Max,
                value: 100,
            }
        }
    });

    showHelpLink = new formattingSettings.ToggleSwitch({
        name: "showHelpLink",
        displayNameKey: "Visual_Show_HelpButton",
        value: false
    });

    name: string = "generalView";
    displayNameKey: string = "Visual_GeneralView";
    helpLinkColor: string = "#80B0E0"
    slices: Array<FormattingSettingsSlice> = [this.opacity, this.showHelpLink];
}

/**
* Interface for BarChart settings.
*
* @interface
* @property {{generalView.opacity:number}} Bars Opacity - Controls opacity of plotted bars, values range between 10 (almost transparent) to 100 (fully opaque, default)
* @property {{generalView.showHelpLink:boolean}} Show Help Button - When TRUE, the plot displays a button which launch a link to documentation.
*/
export class SampleMatrixSettingsModel extends FormattingSettingsModel {
    generalView = new GeneralViewCardSettings();
    subTotals = new SubTotalsCardSettings();
    cards = [this.generalView, this.subTotals];

     /**
     * populate subTotals options object categories formatting properties
     * @param objects
     * @param rowsHierarchyLevels
     * @param columnsHierarchyLevels 
     */
      public populateSubTotalsOptions(objects: DataViewObjects, rowsHierarchyLevels: DataViewHierarchyLevel[], columnsHierarchyLevels: DataViewHierarchyLevel[]) {
        this.subTotals.populateSubTotalsOptions(objects, rowsHierarchyLevels, columnsHierarchyLevels);
      }
}

class SubTotalsCardSettings extends FormattingSettingsCard {
    name: string = SubtotalProperties.ObjectSubTotals;
    displayName: string = "Subtotals";
    slices: Array<FormattingSettingsSlice> = [];   

    public populateSubTotalsOptions(objects: DataViewObjects, rowsHierarchyLevels: DataViewHierarchyLevel[], columnsHierarchyLevels: DataViewHierarchyLevel[]) {
        let slices = this.slices;
        const rowSubtotalsEnabled: boolean = SubTotalsCardSettings.getPropertyValue<boolean>(objects, SubtotalProperties.rowSubtotals);
        const columnSubtotalsEnabled: boolean = SubTotalsCardSettings.getPropertyValue<boolean>(objects, SubtotalProperties.columnSubtotals);
        
        let rowSubtotals = new formattingSettings.ToggleSwitch(
            {
                name: SubtotalProperties.rowSubtotals.propertyIdentifier.propertyName,
                displayName: "Row subtotals",
                value: rowSubtotalsEnabled,
                topLevelToggle: false
            }
        );

        slices.push(rowSubtotals);

        if (rowSubtotalsEnabled) {
            // Per row level
            const perLevel = SubTotalsCardSettings.getPropertyValue<boolean>(objects, SubtotalProperties.rowSubtotalsPerLevel);
            let rowSubtotalsPerLevel = new formattingSettings.ToggleSwitch(
                {
                    name: SubtotalProperties.rowSubtotalsPerLevel.propertyIdentifier.propertyName,
                    displayName: "Row per level subtotals",
                    value: perLevel,
                    topLevelToggle: false
                }
            );

            slices.push(rowSubtotalsPerLevel);

            if (perLevel)
                this.populatePerLevelSubtotals(rowsHierarchyLevels);


            let rowSubtotalsTypeValue = SubTotalsCardSettings.getPropertyValue<powerbi.RowSubtotalType>(objects,  SubtotalProperties.rowSubtotalsType);
            let rowSubtotalsType = new formattingSettings.ItemDropdown({
                name: SubtotalProperties.rowSubtotalsType.propertyIdentifier.propertyName,
                displayName: "Location of row (sub) totals",
                value: { displayName: rowSubtotalsTypeValue, value: rowSubtotalsTypeValue },
                items: [{
                    displayName: powerbi.RowSubtotalType.Bottom,
                    value: powerbi.RowSubtotalType.Bottom
                }, {
                    displayName: powerbi.RowSubtotalType.Top,
                    value: powerbi.RowSubtotalType.Top
                }],    
            });
            slices.push(rowSubtotalsType);

        }

        let columnSubtotals = new formattingSettings.ToggleSwitch(
            {
                name: SubtotalProperties.columnSubtotals.propertyIdentifier.propertyName,
                displayName: "Column subtotals",
                value: columnSubtotalsEnabled,
                topLevelToggle: false
            }
        );
        slices.push(columnSubtotals);
        
        if (columnSubtotalsEnabled) {
        
            // Per column level
            const perLevel = SubTotalsCardSettings.getPropertyValue<boolean>(objects, SubtotalProperties.columnSubtotalsPerLevel);
            let columnSubtotalsPerLevel = new formattingSettings.ToggleSwitch(
                {
                    name: SubtotalProperties.columnSubtotalsPerLevel.propertyIdentifier.propertyName,
                    displayName: "Column per level subtotals",
                    value: perLevel,
                    topLevelToggle: false
                }
            );

            slices.push(columnSubtotalsPerLevel);

            if (perLevel)
                this.populatePerLevelSubtotals(columnsHierarchyLevels);
        }        
    }

    private populatePerLevelSubtotals(hierarchyLevels: DataViewHierarchyLevel[]) {
        let slices = this.slices;
        for (const level of hierarchyLevels) {
            for (const source of level.sources) {
                if (!source.isMeasure) {
                    let subtotalsLevel = new formattingSettings.ToggleSwitch(
                        {
                            selector: { metadata: source.queryName },
                            name: SubtotalProperties.levelSubtotalEnabled.propertyIdentifier.propertyName,
                            displayName: source.displayName,
                            value: SubTotalsCardSettings.getPropertyValue(source.objects, SubtotalProperties.levelSubtotalEnabled),
                            topLevelToggle: false
                        }
                    );
                    this.slices.push(subtotalsLevel);
                }
            }
        }
    }
        

    private createVisualObjectInstance(objectName: string, selector: Selector = null, displayName?: string): VisualObjectInstance {
        const instance: VisualObjectInstance = {
            selector: selector,
            objectName: objectName,
            properties: {},
        };
        
        if (displayName != null)
            instance.displayName = displayName;
        
        return instance;
    }
        

    private static getPropertyValue<T>(objects: DataViewObjects, dataViewObjectPropertyReference: DataViewObjectPropertyReference<T>): T {
        let object;
        if (objects) {
            object = objects[dataViewObjectPropertyReference.propertyIdentifier.objectName];
        }
        return SubTotalsCardSettings.getValue(object, dataViewObjectPropertyReference.propertyIdentifier.propertyName, dataViewObjectPropertyReference.defaultValue);
    }

    private static setInstancePropertyAndReturnValue<T>(objects: DataViewObjects, dataViewObjectPropertyReference: DataViewObjectPropertyReference<T>, instance: VisualObjectInstance): T {
        const value = this.getPropertyValue(objects, dataViewObjectPropertyReference);
        if (instance && instance.properties) {
            instance.properties[dataViewObjectPropertyReference.propertyIdentifier.propertyName] = value;
        }
        return value;
    }

    private static getValue<T>(
        object: DataViewObject,
        propertyName: string,
        defaultValue?: T,
        instanceId?: string): T {

        if (!object)
            return defaultValue;

        if (instanceId) {
            const instances = object.$instances;
            if (!instances)
                return defaultValue;

            const instance = instances[instanceId];
            if (!instance)
                return defaultValue;

            object = instance;
        }

        const propertyValue = <T>object[propertyName];
        if (propertyValue === undefined)
            return defaultValue;

        return propertyValue;
    }

}






