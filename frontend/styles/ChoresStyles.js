import {StyleSheet} from "react-native";

import colors from '../styles/MainStyles';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F7F7',
    },
    header: {
        padding:15,
        backgroundColor: colors.primary ,
        alignItems: 'center',
    },
    choresheader:{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingVertical: 10,
        marginLeft:10,
    },
    HHname: {
        fontSize: 24,
        fontWeight: 'bold',
        //color: '#fff',
    },
    choresDone: {
        fontSize: 16,
        marginTop: 5,
        //color: '#fff'
    },
    list: {
        margin:10,
        padding:10,
        backgroundColor:'#bbb',
        borderRadius:10,
        flex: 1,
    },
    choreItem: {
        flexDirection: 'row',        // Arrange items in a row
        alignItems: 'center',        // Align items vertically in the center
        justifyContent: 'space-between', // Space out elements to utilize full width
        paddingVertical: 10,
        paddingHorizontal:10,         // Adjust spacing as needed
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        backgroundColor:colors.background,
        borderRadius:10,
        marginBottom:10,

    },
    choreTextContainer: {
        flex: 1,                     // Take up available space
        flexDirection: 'column',     // Stack the text elements vertically
    },
    choreText: {
        padding:5,
        fontSize: 16,                // Adjust font size as needed
        color: '#333',
    },
    headertext:{
        marginTop:15,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    completedChoreText: {
        textDecorationLine: 'line-through',
        color: '#999',
    },
    choreAssignedTo: {
        fontSize: 14,
        color: '#555',
        marginTop: 5,
    },
    choreActions: {
        flexDirection: 'row',
        marginTop: 10,
        justifyContent: 'flex-end',
    },
    completeButton: {
        backgroundColor: '#03dac5',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 5,
        marginRight: 10,
    },
    settingsButton: {
        backgroundColor: '#dc3545',
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
    form: {
        padding: 15,
        backgroundColor: '#fff',
        borderTopColor: '#ddd',
        borderTopWidth: 1,
    },
    input: {
        borderColor: '#ddd',
        borderWidth: 1,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 5,
        marginBottom: 10,
        fontSize: 16,
    },
    addButton: {
        backgroundColor: colors.primary,
        paddingVertical: 12,
        borderRadius: 5,
        alignItems: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontSize: 18,
    },
    profileImage: {
        width: 45,
        height: 45,
        borderRadius: 15,
        marginHorizontal: 10,
    },
});

export default styles;