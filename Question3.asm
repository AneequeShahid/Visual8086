org 100h

    
    mov ah, 09h
    lea dx, prompt
    int 21h

   
    mov ah, 01h
    int 21h
    mov bl, al      

    int 21h
    mov bh, al     

    int 21h
    mov cl, al     

   
    mov ah, 02h

   
    mov dl, 10     
    int 21h
    mov dl, 13  
    int 21h
    mov dl, bl
    int 21h


    mov dl, 10
    int 21h
    mov dl, 13
    int 21h
    mov dl, bh
    int 21h

   
    mov dl, 10
    int 21h
    mov dl, 13
    int 21h
    mov dl, cl
    int 21h

   
    mov ah, 4ch
    int 21h


    prompt db 'ENTER THREE INITIALS: $'