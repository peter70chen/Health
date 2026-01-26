on run argv
    if (count of argv) < 3 then
        return "Error: Please provide Recipient, Subject, and Content."
    end if
    
    set toAddress to item 1 of argv
    set msgSubject to item 2 of argv
    set msgContent to item 3 of argv
    
    tell application "Mail"
        set newMessage to make new outgoing message with properties {subject:msgSubject, content:msgContent & return & return, visible:true}
        tell newMessage
            make new to recipient at end of to recipients with properties {address:toAddress}
        end tell
        activate
        return "Draft created successfully. Please review and send in Mail app."
    end tell
end run
