/**
 * @file ChoresStyles.js
 * @brief Styles for Chore related screens
 * @author Robert Zelníček <xzelni06@stud.fit.vutbr.cz>
 * @date 12.12.2024
 */
import {StyleSheet} from 'react-native';
import colors from '../styles/MainStyles'

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F7F7',
    },
    list: {
        marginHorizontal: 10,
        marginVertical: 5,
    },
    choreItem: {
        flexDirection: 'row',
        backgroundColor: '#DDD',
        padding: 10,
        marginBottom: 5,
        marginLeft: 10,
        marginRight:10,
        alignItems: 'center',
        borderRadius: 15,
        borderColor:'#DDD',
        borderLeftWidth:4,
        borderTopLeftRadius:15,
        borderBottomLeftRadius:15
    },
    ScheduledChore: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e0e0e0',
        padding: 10,
        paddingVertical: 13,
        borderRadius: 15,
        marginVertical: 5,
        marginHorizontal:18,
        justifyContent: 'space-between',
    },
    choreHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    profileImage:{width:40, height:40,marginLeft:10},
    choreTextContainer: { flex: 1, marginHorizontal: 10 },
    choreText: { fontSize: 16, color: '#333' },
    scheduledchoreText: {padding:3, fontSize: 16, color: '#333' },
    completedChoreText: { textDecorationLine: 'line-through', color: 'gray' },
    choreAssignedTo: { fontSize: 12, color: '#555' },
    completeButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
    },
    takeOverButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    buttonText: { color: '#fff' },
    addButtonToggle: {
        position: 'absolute',
        bottom: 80,
        right: 20,
    },
    form: {
        backgroundColor: '#eee',
        padding: 10,
        borderRadius: 10,
        margin:10
    },
    input: {
        backgroundColor: '#fff',
        marginBottom: 10,
        padding: 10,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    inputpicker:{
        fontSize: 16,
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor:'#fff',
        borderRadius: 5,
        color: colors.primary,
        marginBottom: 15,
    },
    addButton: {
        backgroundColor: colors.primary,
        padding: 10,
        borderRadius: 15,
        width:200,
        alignItems: 'center',
        alignSelf:'center',
    },
    addButtonText: { color: '#fff', fontWeight: 'bold' },
    sectionHeader: { 
        fontSize: 22,
        fontWeight: 'bold',
        marginHorizontal:10, 
        marginTop:20,
        marginBottom:5,
        color:colors.secondary, 
        flex:1,
    },
    // New styles for AddChoreScreen
    addChoreContainer: {
        flex:1,
        backgroundColor:'#fff',
    },
    addChoreTitle: {
        fontSize:20,
        fontWeight:'bold',
        marginBottom:2,
        marginTop:20,
        marginLeft:20,
    },

    // Stats screen styles
    statsHeader: {
        flexDirection: 'row',
        backgroundColor: '#6200EE',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 15,
        justifyContent: 'space-between',
    },
    statsHeaderTitle: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
        marginLeft:0,
        alignSelf:'center'
    },
    statsContent: {
        padding: 10
    },
    statsSectionHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10
    },
    statsItem: {
        backgroundColor: '#DDD',
        padding: 10,
        marginBottom: 10,
        borderRadius: 5
    },
    statsUserName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5
    },
    statsText: {
        fontSize: 14,
        marginBottom: 2
    },
    statsLoadingContainer: {
        flex:1,
        justifyContent:'center',
        alignItems:'center'
    },
    iconButton: {
        marginHorizontal: 10
    },
    GoToAddButton: {
        backgroundColor: colors.primary,
        borderRadius: 30,
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: 30,
        alignSelf: 'center',
    },
    DoneButton: {
        width: 64,
        height: 32,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: colors.primary,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 0,
        marginLeft: 10,
    },
    NoChoreText:{
        fontSize: 14,
        color: '#aaa',
        textAlign: 'center',
        padding:10,
        marginHorizontal:40,
        marginVertical:20,
    },
    NoChoremainText:{
        fontSize: 14,
        color: '#aaa',
        textAlign: 'center',
        padding:10,
        marginHorizontal:40,
        marginVertical:0,
    },
    othersChoresMessageText: {
        fontSize: 14,
        color: '#aaa',
        textAlign: 'center',
        padding:10,
        marginHorizontal:40,
        marginVertical:20,
    },
    switchContainer: {
        backgroundColor: "#ededed",
        //backgroundColor: "rgba(116,29,237,0.12)",
        flexDirection: 'row',
        justifyContent: 'center',
        borderRadius: 15,
        padding: 5,
        paddingHorizontal: 5,
        marginHorizontal: 50,
        marginTop:20,
        marginBottom:10

    },
    switchLabel: {
        fontSize: 16,
        fontWeight: "500",
        color: "#333",
    },
    toggleOption: {
        flex: 1,
        paddingVertical: 13,
        paddingHorizontal: 15,
        alignItems: 'center',
        borderRadius: 10,
        marginHorizontal: 5,
    },
    toggleOptionSelected: {
        backgroundColor: '#aaa',
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginHorizontal: 10,
        backgroundColor:'grey'
    },
    header: {
        backgroundColor: colors.primary,
        padding: 15,
        flexDirection: 'row', // Align elements horizontally
        alignItems: 'center',
        justifyContent: 'space-between', // Space menu button and center content properly
    },
    menuButton: {
        padding: 10, // Ensure touchable area for the button
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerContent: {
        position: 'absolute', // Position it relative to the header
        left: 0, // Reset alignment
        right: 0, // Take the full width of the header
        alignItems: 'center', // Center the content horizontally
    },
    householdName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    itemCounter: {
        fontSize: 16,
        color: 'white',
        marginTop: 5,
    },
    statsHeader: {
        flexDirection: 'row',
        backgroundColor: '#6200EE',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 15,
        justifyContent: 'space-between'
    },
    statsHeaderTitle: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },
    statsSectionHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        marginTop: 20,
        alignSelf:'center',
    }

});
